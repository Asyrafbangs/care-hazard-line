import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { generateHazardSummary } from "@/lib/ai";
import { generateReportNo } from "@/lib/report-number";
import type { LanguageCode, UrgencyLevel } from "@/types/domain";
import type {
  AiConversationContext,
  AiConversationSlots,
  WhatsAppEngineResult,
  WhatsAppInboundMessage,
  WhatsAppReportDraft,
  WhatsAppSessionContext,
  WhatsAppSessionRow,
  WhatsAppSessionState,
  WhatsAppStoredPhoto
} from "@/lib/whatsapp/types";
import { isGeminiConfigured } from "@/lib/gemini";
import { runAiConversationTurn } from "@/lib/whatsapp/ai-agent";
import {
  aiReviewMessage,
  cleanText,
  helpMessage,
  isHelpText,
  languageMenu,
  mainMenu,
  normalizeWhatsAppPhone,
  parseAiConfirmation,
  parseConsent,
  parseLanguage,
  parseMainMenu,
  parseReporterCategory,
  parseUrgency,
  promptForCategory,
  promptForConsent,
  promptForDescription,
  promptForLocation,
  promptForName,
  promptForPhoto,
  promptForUrgency
} from "@/lib/whatsapp/messages";
import { storeWhatsAppImage } from "@/lib/whatsapp/media";
import { sendWhatsAppText } from "@/lib/whatsapp/send";

type Supabase = ReturnType<typeof createSupabaseAdmin>;

type ReporterRow = {
  id: string;
  name: string;
  phone_number: string;
  category: "employee" | "visitor";
  employee_id: string | null;
  company_name: string | null;
  preferred_language: LanguageCode;
};

function defaultContext(profileName?: string): WhatsAppSessionContext {
  return profileName ? { name: profileName } : {};
}

function prefillSlots(reporter: ReporterRow | null): AiConversationSlots {
  if (!reporter) return {};
  return {
    name: reporter.name,
    category: reporter.category,
    employeeId: reporter.employee_id,
    companyName: reporter.company_name,
    consent: true
  };
}

function newAiContext(reporter: ReporterRow | null): AiConversationContext {
  return {
    transcript: [],
    slots: prefillSlots(reporter),
    phase: reporter ? "reporting" : "setup"
  };
}

function withReply(reply: string, state: WhatsAppSessionState, extra?: Partial<WhatsAppEngineResult>): WhatsAppEngineResult {
  return { ok: true, reply, state, shouldSend: true, ...extra };
}

async function getReporter(supabase: Supabase, phoneNumber: string): Promise<ReporterRow | null> {
  const { data, error } = await supabase
    .from("reporters")
    .select("id, name, phone_number, category, employee_id, company_name, preferred_language")
    .eq("phone_number", phoneNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ReporterRow | null;
}

async function getOrCreateSession(input: {
  supabase: Supabase;
  phoneNumber: string;
  whatsappId: string;
  profileName?: string;
}): Promise<{ session: WhatsAppSessionRow; reporter: ReporterRow | null }> {
  const reporter = await getReporter(input.supabase, input.phoneNumber);

  const { data: existing, error } = await input.supabase
    .from("whatsapp_sessions")
    .select("id, phone_number, reporter_id, state, selected_language, context")
    .eq("phone_number", input.phoneNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (existing) {
    const session = existing as WhatsAppSessionRow;
    return { session, reporter };
  }

  const aiMode = isGeminiConfigured();
  const initialState: WhatsAppSessionState = aiMode ? "ai_chat" : reporter ? "main_menu" : "await_language";
  const selectedLanguage = reporter?.preferred_language ?? "en";
  const context: WhatsAppSessionContext = reporter
    ? {
        name: reporter.name,
        category: reporter.category,
        employeeId: reporter.employee_id,
        companyName: reporter.company_name
      }
    : defaultContext(input.profileName);

  if (aiMode) {
    context.aiChat = newAiContext(reporter);
  }

  const { data: created, error: createError } = await input.supabase
    .from("whatsapp_sessions")
    .insert({
      phone_number: input.phoneNumber,
      reporter_id: reporter?.id ?? null,
      state: initialState,
      selected_language: selectedLanguage,
      context,
      last_inbound_at: new Date().toISOString()
    })
    .select("id, phone_number, reporter_id, state, selected_language, context")
    .single();

  if (createError || !created) throw new Error(createError?.message ?? "Could not create WhatsApp session.");

  return { session: created as WhatsAppSessionRow, reporter };
}

async function saveSession(supabase: Supabase, session: WhatsAppSessionRow) {
  const { error } = await supabase
    .from("whatsapp_sessions")
    .update({
      reporter_id: session.reporter_id,
      state: session.state,
      selected_language: session.selected_language,
      context: session.context,
      last_inbound_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", session.id);

  if (error) throw new Error(error.message);
}

async function setState(
  supabase: Supabase,
  session: WhatsAppSessionRow,
  state: WhatsAppSessionState,
  context?: WhatsAppSessionContext,
  language?: LanguageCode
) {
  session.state = state;
  if (context) session.context = context;
  if (language) session.selected_language = language;
  await saveSession(supabase, session);
}

async function upsertReporterFromSession(supabase: Supabase, session: WhatsAppSessionRow, phoneNumber: string) {
  const context = session.context;
  if (!context.name || !context.category) {
    throw new Error("Reporter setup is incomplete.");
  }

  const { data: reporter, error } = await supabase
    .from("reporters")
    .upsert(
      {
        whatsapp_id: `wa_${phoneNumber}`,
        phone_number: phoneNumber,
        name: context.name,
        category: context.category,
        employee_id: context.category === "employee" ? context.employeeId ?? null : null,
        company_name: context.category === "visitor" ? context.companyName ?? null : null,
        preferred_language: session.selected_language,
        identity_visibility: "ehs_only",
        consent_accepted: true,
        consent_accepted_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      },
      { onConflict: "phone_number" }
    )
    .select("id, name, phone_number, category, employee_id, company_name, preferred_language")
    .single();

  if (error || !reporter) throw new Error(error?.message ?? "Could not save reporter profile.");

  await supabase.from("language_preferences").insert({
    reporter_id: reporter.id,
    language_code: session.selected_language,
    source: "whatsapp_setup"
  });

  session.reporter_id = reporter.id;
  return reporter as ReporterRow;
}

async function createReportFromDraft(input: {
  supabase: Supabase;
  reporter: ReporterRow;
  session: WhatsAppSessionRow;
}): Promise<{ reportNo: string; urgency: UrgencyLevel }> {
  const draft = input.session.context.draft;
  if (!draft?.description || !draft.photo || !draft.locationText || !draft.aiSummary) {
    throw new Error("Draft report is incomplete. Description, photo, location and AI summary are required.");
  }

  const { data: selectedLocation } = await input.supabase
    .from("locations")
    .select("id, area, name")
    .ilike("name", draft.locationText)
    .maybeSingle();

  const { data: selectedCategory } = await input.supabase
    .from("hazard_categories")
    .select("id, name")
    .eq("name", draft.aiSummary.suggestedCategory)
    .maybeSingle();

  const reportNo = await generateReportNo(input.supabase);
  const submittedAt = new Date().toISOString();
  const urgency = draft.workerUrgency === "urgent" ? "urgent" : draft.aiSummary.urgencyLevel;

  const { data: report, error: reportError } = await input.supabase
    .from("hazard_reports")
    .insert({
      report_no: reportNo,
      reporter_id: input.reporter.id,
      report_type: "hazard",
      original_description: draft.description,
      selected_language: input.session.selected_language,
      location_id: selectedLocation?.id ?? null,
      location_text: selectedLocation ? `${selectedLocation.area} - ${selectedLocation.name}` : draft.locationText,
      ai_hazard_summary: draft.aiSummary.hazardSummary,
      ai_category_id: selectedCategory?.id ?? null,
      ai_category_name: draft.aiSummary.suggestedCategory,
      ai_urgency: draft.aiSummary.urgencyLevel,
      ai_recommended_immediate_action: draft.aiSummary.recommendedImmediateAction,
      ai_suggested_owner_department: draft.aiSummary.suggestedOwnerDepartment,
      ai_status: draft.aiSummary.aiStatus,
      reporter_confirmed_ai_summary: true,
      final_category_id: selectedCategory?.id ?? null,
      final_urgency: urgency,
      status: "submitted",
      is_urgent_alert_sent: ["high", "urgent"].includes(urgency),
      submitted_at: submittedAt
    })
    .select("id, report_no")
    .single();

  if (reportError || !report) throw new Error(reportError?.message ?? "Could not create report.");

  await insertPhoto(input.supabase, report.id, input.reporter.id, draft.photo);

  await input.supabase.from("status_history").insert({
    report_id: report.id,
    old_status: "draft",
    new_status: "submitted",
    changed_by_reporter_id: input.reporter.id,
    comment: "Reporter accepted AI summary and submitted through WhatsApp conversation flow."
  });

  if (["high", "urgent"].includes(urgency)) {
    await createUrgentAlerts(input.supabase, report.id, report.report_no, urgency);
  }

  return { reportNo: report.report_no, urgency };
}

async function insertPhoto(supabase: Supabase, reportId: string, reporterId: string, photo: WhatsAppStoredPhoto) {
  const { error } = await supabase.from("hazard_photos").insert({
    report_id: reportId,
    storage_provider: photo.provider,
    supabase_bucket: photo.bucket ?? null,
    supabase_storage_path: photo.path ?? null,
    original_file_name: photo.originalFileName ?? null,
    mime_type: photo.mimeType ?? null,
    size_bytes: photo.sizeBytes ?? null,
    cloudinary_public_id: null,
    cloudinary_url: null,
    photo_type: "hazard",
    uploaded_by_reporter_id: reporterId
  });

  if (error) throw new Error(error.message);
}

async function createUrgentAlerts(supabase: Supabase, reportId: string, reportNo: string, urgency: string) {
  const { data: ehsUsers } = await supabase.from("ehs_users").select("user_id");
  const rows = (ehsUsers ?? []).map((user) => ({
    report_id: reportId,
    recipient_type: "ehs",
    recipient_user_id: user.user_id,
    channel: "in_app",
    template_key: "urgent_hazard_alert_whatsapp",
    message_preview: `${urgency.toUpperCase()} WhatsApp hazard report ${reportNo} requires EHS review.`,
    status: "pending"
  }));

  if (rows.length > 0) await supabase.from("notifications").insert(rows);

  const alertNumbers = (process.env.WHATSAPP_EHS_ALERT_NUMBERS ?? "")
    .split(",")
    .map((item) => normalizeWhatsAppPhone(item))
    .filter(Boolean);

  await Promise.all(
    alertNumbers.map(async (to) => {
      const result = await sendWhatsAppText({
        to,
        body: `URGENT CARE Hazard Line alert\nReport: ${reportNo}\nPlease open EHS dashboard for review.`
      });

      await supabase.from("whatsapp_message_logs").insert({
        phone_number: to,
        direction: "outbound",
        message_type: "urgent_ehs_alert",
        message_text: `URGENT CARE Hazard Line alert for ${reportNo}`,
        payload: result,
        status: result.ok ? "sent" : result.skipped ? "skipped" : "failed"
      });
    })
  );
}

async function getRecentStatus(supabase: Supabase, reporter: ReporterRow, reportNo?: string) {
  let query = supabase
    .from("hazard_reports")
    .select("id, report_no, ai_hazard_summary, original_description, status, final_urgency, ai_urgency, location_text, submitted_at, closed_at, updated_at")
    .eq("reporter_id", reporter.id)
    .order("created_at", { ascending: false })
    .limit(reportNo ? 1 : 3);

  if (reportNo) query = query.eq("report_no", reportNo.trim().toUpperCase());

  const { data: reports, error } = await query;
  if (error) throw new Error(error.message);

  if (!reports || reports.length === 0) {
    return reportNo
      ? `No report found for ${reportNo}. Please check the report ID.`
      : "No report found for your phone number yet.";
  }

  const reportIds = reports.map((report) => report.id);
  const { data: assignments } = await supabase
    .from("report_assignments")
    .select("report_id, status, due_date")
    .in("report_id", reportIds);

  return reports
    .map((report, index) => {
      const assignment = (assignments ?? []).find((item) => item.report_id === report.id);
      return [
        `${index + 1}. ${report.report_no}`,
        `Hazard: ${report.ai_hazard_summary ?? report.original_description}`,
        `Location: ${report.location_text ?? "Not stated"}`,
        `Status: ${report.status}`,
        assignment ? `Action: ${assignment.status}, due ${assignment.due_date}` : "Action: EHS review pending",
        report.closed_at ? `Closed: ${new Date(report.closed_at).toLocaleDateString()}` : null
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

async function handleSetup(input: {
  supabase: Supabase;
  session: WhatsAppSessionRow;
  inbound: WhatsAppInboundMessage;
}) {
  const text = cleanText(input.inbound.text);
  const context = input.session.context ?? {};

  if (input.session.state === "await_language") {
    const language = parseLanguage(text);
    if (!language) {
      await setState(input.supabase, input.session, "await_language");
      return withReply(languageMenu(), "await_language");
    }

    input.session.selected_language = language;
    await setState(input.supabase, input.session, "await_name", context, language);
    return withReply(promptForName(input.inbound.profileName ?? context.name), "await_name");
  }

  if (input.session.state === "await_name") {
    const name = /^yes$/i.test(text) && input.inbound.profileName ? input.inbound.profileName : text;
    if (name.length < 2) {
      return withReply("Please type your full name.", "await_name");
    }
    context.name = name;
    await setState(input.supabase, input.session, "await_category", context);
    return withReply(promptForCategory(), "await_category");
  }

  if (input.session.state === "await_category") {
    const category = parseReporterCategory(text);
    if (!category) return withReply(promptForCategory(), "await_category");
    context.category = category;
    const nextState = category === "employee" ? "await_employee_id" : "await_company_name";
    await setState(input.supabase, input.session, nextState, context);
    return withReply(category === "employee" ? "Please enter your Employee ID. If not sure, type SKIP." : "Please enter your company name.", nextState);
  }

  if (input.session.state === "await_employee_id") {
    context.employeeId = text.toLowerCase() === "skip" ? null : text;
    await setState(input.supabase, input.session, "await_consent", context);
    return withReply(promptForConsent(), "await_consent");
  }

  if (input.session.state === "await_company_name") {
    if (text.length < 2) return withReply("Please enter your company name.", "await_company_name");
    context.companyName = text;
    await setState(input.supabase, input.session, "await_consent", context);
    return withReply(promptForConsent(), "await_consent");
  }

  if (input.session.state === "await_consent") {
    const consent = parseConsent(text);
    if (!consent) return withReply(promptForConsent(), "await_consent");

    const reporter = await upsertReporterFromSession(input.supabase, input.session, input.inbound.phoneNumber);
    await setState(input.supabase, input.session, "main_menu", {
      name: reporter.name,
      category: reporter.category,
      employeeId: reporter.employee_id,
      companyName: reporter.company_name
    });
    return withReply(`${mainMenu(input.session.selected_language, reporter.name)}`, "main_menu");
  }

  return null;
}

async function handleReportFlow(input: {
  supabase: Supabase;
  session: WhatsAppSessionRow;
  reporter: ReporterRow;
  inbound: WhatsAppInboundMessage;
}) {
  const text = cleanText(input.inbound.text ?? input.inbound.caption);
  const context = input.session.context ?? {};
  const draft: WhatsAppReportDraft = context.draft ?? {};

  if (input.session.state === "await_description") {
    if (text.length < 4) return withReply(promptForDescription(input.session.selected_language), "await_description");
    draft.description = text;
    context.draft = draft;
    await setState(input.supabase, input.session, "await_photo", context);
    return withReply(promptForPhoto(), "await_photo");
  }

  if (input.session.state === "await_photo") {
    if (input.inbound.type !== "image" || !input.inbound.mediaId) {
      return withReply(`Photo is mandatory.\n${promptForPhoto()}`, "await_photo");
    }

    try {
      draft.photo = await storeWhatsAppImage({
        phoneNumber: input.inbound.phoneNumber,
        mediaId: input.inbound.mediaId,
        mimeType: input.inbound.mediaMimeType,
        source: input.inbound.source
      });
      context.draft = draft;
      await setState(input.supabase, input.session, "await_location", context);
      return withReply(promptForLocation(), "await_location");
    } catch (error) {
      return withReply(
        `Photo received, but the system could not store it. ${error instanceof Error ? error.message : "Unknown error"}\nPlease try sending the photo again.`,
        "await_photo"
      );
    }
  }

  if (input.session.state === "await_location") {
    if (text.length < 2) return withReply(promptForLocation(), "await_location");
    draft.locationText = text;
    context.draft = draft;
    await setState(input.supabase, input.session, "await_urgency", context);
    return withReply(promptForUrgency(), "await_urgency");
  }

  if (input.session.state === "await_urgency") {
    const urgency = parseUrgency(text);
    if (!urgency) return withReply(promptForUrgency(), "await_urgency");

    draft.workerUrgency = urgency;
    const aiSummary = await generateHazardSummary({
      description: draft.description ?? "",
      location: draft.locationText
    });

    draft.aiSummary = {
      ...aiSummary,
      urgencyLevel: urgency === "urgent" ? "urgent" : aiSummary.urgencyLevel
    };
    context.draft = draft;
    await setState(input.supabase, input.session, "await_ai_confirmation", context);
    return withReply(aiReviewMessage(draft.aiSummary), "await_ai_confirmation");
  }

  if (input.session.state === "await_ai_confirmation") {
    const decision = parseAiConfirmation(text);
    if (decision === "edit") {
      context.draft = {};
      await setState(input.supabase, input.session, "await_description", context);
      return withReply(`No problem.\n${promptForDescription(input.session.selected_language)}`, "await_description");
    }

    if (decision !== "confirm") {
      return withReply(aiReviewMessage(draft.aiSummary!), "await_ai_confirmation");
    }

    const result = await createReportFromDraft({
      supabase: input.supabase,
      reporter: input.reporter,
      session: input.session
    });

    context.draft = {};
    await setState(input.supabase, input.session, "main_menu", context);

    return withReply(
      [
        "Thank you. Your report has been submitted.",
        `Report ID: ${result.reportNo}`,
        `Status: Submitted, waiting for EHS review.`,
        result.urgency === "urgent" ? "Urgent alert has been recorded for EHS attention." : null,
        "Type STATUS anytime to check progress."
      ]
        .filter(Boolean)
        .join("\n"),
      "main_menu",
      { reportNo: result.reportNo }
    );
  }

  return null;
}

async function handleAiConversation(input: {
  supabase: Supabase;
  session: WhatsAppSessionRow;
  reporter: ReporterRow | null;
  inbound: WhatsAppInboundMessage;
}): Promise<WhatsAppEngineResult> {
  const text = cleanText(input.inbound.text ?? input.inbound.caption);
  const context: WhatsAppSessionContext = input.session.context ?? {};
  input.session.context = context;
  const draft: WhatsAppReportDraft = context.draft ?? {};
  context.draft = draft;

  // STATUS works at any point for a known reporter.
  if (/^status$/i.test(text)) {
    const rep = input.reporter ?? (input.session.reporter_id ? await getReporter(input.supabase, input.inbound.phoneNumber) : null);
    if (rep) {
      const statusText = await getRecentStatus(input.supabase, rep);
      await setState(input.supabase, input.session, "ai_chat", context);
      return withReply(`${statusText}\n\nType STATUS anytime, or just tell me about a new hazard.`, "ai_chat");
    }
  }

  // Capture an inbound photo ourselves; the binary never goes to the model.
  let photoJustReceived = false;
  if (input.inbound.type === "image" && input.inbound.mediaId) {
    try {
      draft.photo = await storeWhatsAppImage({
        phoneNumber: input.inbound.phoneNumber,
        mediaId: input.inbound.mediaId,
        mimeType: input.inbound.mediaMimeType,
        source: input.inbound.source
      });
      photoJustReceived = true;
    } catch (error) {
      await setState(input.supabase, input.session, "ai_chat", context);
      return withReply(
        `I couldn't save that photo (${error instanceof Error ? error.message : "unknown error"}). Could you try sending it again?`,
        "ai_chat"
      );
    }
  }

  const aiContext: AiConversationContext = context.aiChat ?? newAiContext(input.reporter);
  const isNewReporter = !input.reporter && !input.session.reporter_id;
  const hasPhoto = Boolean(draft.photo);

  const turn = await runAiConversationTurn({
    userText: text,
    hasPhoto,
    photoJustReceived,
    isNewReporter,
    reporterName: input.reporter?.name ?? context.name ?? null,
    aiContext
  });

  if (!turn) {
    // Gemini unavailable this turn — keep all collected data, ask to retry.
    context.aiChat = aiContext;
    await setState(input.supabase, input.session, "ai_chat", context);
    return withReply("Sorry, I had a brief problem just now. Could you say that again?", "ai_chat");
  }

  const { result } = turn;
  context.aiChat = turn.aiContext;

  const language: LanguageCode = result.detectedLanguage ?? input.session.selected_language;
  input.session.selected_language = language;

  // Create the reporter profile once setup is complete.
  let activeReporter = input.reporter;
  if (!activeReporter && input.session.reporter_id) {
    activeReporter = await getReporter(input.supabase, input.inbound.phoneNumber);
  }
  if (!activeReporter && !input.session.reporter_id) {
    const slots = result.slots;
    if (slots.name && slots.category && slots.consent === true) {
      context.name = slots.name;
      context.category = slots.category;
      context.employeeId = slots.employeeId ?? null;
      context.companyName = slots.companyName ?? null;
      activeReporter = await upsertReporterFromSession(input.supabase, input.session, input.inbound.phoneNumber);
    }
  }

  // Submit when the model confirms and every required piece is present.
  let reportNo: string | undefined;
  let finalReply = result.reply;
  const canSubmit =
    result.readyToSubmit &&
    activeReporter &&
    draft.photo &&
    result.slots.description &&
    result.slots.locationText &&
    result.hazardAnalysis;

  if (canSubmit && activeReporter) {
    draft.description = result.slots.description;
    draft.locationText = result.slots.locationText;
    draft.workerUrgency = result.slots.urgency;
    draft.aiSummary = {
      hazardSummary: result.hazardAnalysis!.hazardSummary,
      suggestedCategory: result.hazardAnalysis!.suggestedCategory,
      urgencyLevel: result.slots.urgency === "urgent" ? "urgent" : result.hazardAnalysis!.urgencyLevel,
      recommendedImmediateAction: result.hazardAnalysis!.recommendedImmediateAction,
      suggestedOwnerDepartment: result.hazardAnalysis!.suggestedOwnerDepartment,
      aiStatus: "completed"
    };
    context.draft = draft;

    const submitResult = await createReportFromDraft({
      supabase: input.supabase,
      reporter: activeReporter,
      session: input.session
    });
    reportNo = submitResult.reportNo;

    // Reset for the next report but stay in the conversational flow.
    context.draft = {};
    context.aiChat = newAiContext(activeReporter);
    finalReply = [
      result.reply,
      "",
      `Report ID: ${reportNo} — saved and sent to EHS for review.${submitResult.urgency === "urgent" ? " Marked URGENT." : ""}`,
      "Type STATUS anytime to check progress."
    ].join("\n");
  }

  await setState(input.supabase, input.session, "ai_chat", context, language);
  return withReply(finalReply, "ai_chat", reportNo ? { reportNo } : undefined);
}

export async function processWhatsAppInbound(inbound: WhatsAppInboundMessage): Promise<WhatsAppEngineResult> {
  const supabase = createSupabaseAdmin();
  const phoneNumber = normalizeWhatsAppPhone(inbound.phoneNumber);
  const normalizedInbound = { ...inbound, phoneNumber, whatsappId: inbound.whatsappId || `wa_${phoneNumber}` };
  const { session, reporter } = await getOrCreateSession({
    supabase,
    phoneNumber,
    whatsappId: normalizedInbound.whatsappId,
    profileName: normalizedInbound.profileName
  });

  const text = cleanText(normalizedInbound.text ?? normalizedInbound.caption);

  await supabase.from("reporters").update({ last_seen_at: new Date().toISOString() }).eq("phone_number", phoneNumber);

  const aiMode = isGeminiConfigured();

  if (/^reset$/i.test(text)) {
    if (aiMode) {
      const greeting = reporter
        ? `Hi ${reporter.name}! 👋 I'm here for the CARE Hazard Line. Is there a hazard you'd like to report?`
        : "Hi! 👋 I'm the CARE Hazard Line assistant. I can help you report a workplace hazard. To get started, what's your name?";
      const aiContext = newAiContext(reporter);
      aiContext.transcript.push({ role: "bot", text: greeting });
      const resetContext: WhatsAppSessionContext = reporter
        ? {
            name: reporter.name,
            category: reporter.category,
            employeeId: reporter.employee_id,
            companyName: reporter.company_name,
            draft: {},
            aiChat: aiContext
          }
        : { ...defaultContext(normalizedInbound.profileName), draft: {}, aiChat: aiContext };
      await setState(supabase, session, "ai_chat", resetContext);
      return withReply(greeting, "ai_chat");
    }

    await setState(supabase, session, "await_language", defaultContext(normalizedInbound.profileName), "en");
    return withReply(`Profile reset for testing.\n${languageMenu()}`, "await_language");
  }

  // AI conversation mode: drive setup + reporting through Gemini. Existing
  // in-progress legacy flows keep their state until finished or RESET.
  if (aiMode && (session.state === "ai_chat" || session.state === "main_menu")) {
    return handleAiConversation({ supabase, session, reporter, inbound: normalizedInbound });
  }

  if (/^menu$/i.test(text)) {
    await setState(supabase, session, reporter ? "main_menu" : "await_language", session.context);
    return withReply(reporter ? mainMenu(session.selected_language, reporter.name) : languageMenu(), reporter ? "main_menu" : "await_language");
  }

  if (session.state === "await_language" && reporter) {
    const language = parseLanguage(text);
    if (!language) {
      return withReply(languageMenu(), "await_language");
    }

    await supabase
      .from("reporters")
      .update({ preferred_language: language, last_seen_at: new Date().toISOString() })
      .eq("id", reporter.id);

    await supabase.from("language_preferences").insert({
      reporter_id: reporter.id,
      language_code: language,
      source: "whatsapp_language_change"
    });

    await setState(supabase, session, "main_menu", session.context, language);
    return withReply(mainMenu(language, reporter.name), "main_menu");
  }

  if (isHelpText(text)) {
    return withReply(helpMessage(session.selected_language), session.state);
  }

  if (["await_language", "await_name", "await_category", "await_employee_id", "await_company_name", "await_consent"].includes(session.state)) {
    const setupResult = await handleSetup({ supabase, session, inbound: normalizedInbound });
    if (setupResult) return setupResult;
  }

  const activeReporter = reporter ?? (session.reporter_id ? await getReporter(supabase, phoneNumber) : null);

  if (!activeReporter) {
    await setState(supabase, session, "await_language");
    return withReply(languageMenu(), "await_language");
  }

  if (session.state === "main_menu") {
    const menuChoice = parseMainMenu(text);

    if (menuChoice === "report") {
      const context = { ...session.context, draft: {} };
      await setState(supabase, session, "await_description", context);
      return withReply(promptForDescription(session.selected_language), "await_description");
    }

    if (menuChoice === "status") {
      const statusText = await getRecentStatus(supabase, activeReporter);
      await setState(supabase, session, "await_status_report", session.context);
      return withReply(`${statusText}\n\nType a report ID for detail, or MENU to return.`, "await_status_report");
    }

    if (menuChoice === "help") {
      return withReply(helpMessage(session.selected_language), "main_menu");
    }

    if (menuChoice === "language") {
      await setState(supabase, session, "await_language", session.context);
      return withReply(languageMenu(), "await_language");
    }

    return withReply(mainMenu(session.selected_language, activeReporter.name), "main_menu");
  }

  if (["await_description", "await_photo", "await_location", "await_urgency", "await_ai_confirmation"].includes(session.state)) {
    const reportResult = await handleReportFlow({ supabase, session, reporter: activeReporter, inbound: normalizedInbound });
    if (reportResult) return reportResult;
  }

  if (session.state === "await_status_report") {
    if (/^all$/i.test(text) || text.length === 0) {
      const statusText = await getRecentStatus(supabase, activeReporter);
      return withReply(`${statusText}\n\nType MENU to return.`, "await_status_report");
    }
    const statusText = await getRecentStatus(supabase, activeReporter, text);
    return withReply(`${statusText}\n\nType MENU to return.`, "await_status_report");
  }

  return withReply(mainMenu(session.selected_language, activeReporter.name), session.state);
}
