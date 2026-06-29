"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Send, ShieldCheck, Webhook, XCircle } from "lucide-react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

type ProductionCheck = {
  ok: boolean;
  configured: boolean;
  webhookUrl: string;
  verificationTestUrl: string;
  env: Record<string, boolean | string>;
  masked: { phoneNumberId: string | null; accessToken: string | null };
  phoneNumberInfo?: Record<string, unknown> | null;
};

function StatusLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 size={16} className="text-safety-green" /> : <XCircle size={16} className="text-red-600" />}
      <span className={ok ? "text-slate-700" : "text-red-700"}>{label}</span>
    </div>
  );
}

export function WhatsAppProductionPanel() {
  const [check, setCheck] = useState<ProductionCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("CARE Hazard Line WhatsApp production test. Please reply STATUS to check report progress.");
  const [templateTo, setTemplateTo] = useState("");
  const [templateName, setTemplateName] = useState("care_hazard_update");
  const [templateLanguage, setTemplateLanguage] = useState("en_US");
  const [templateParams, setTemplateParams] = useState("HZ-2026-0001, Closed");
  const [result, setResult] = useState<string | null>(null);

  async function refreshCheck() {
    setLoading(true);
    setResult(null);
    const response = await fetch("/api/whatsapp/production-check", { cache: "no-store" });
    const data = await response.json();
    setCheck(data);
    setLoading(false);
  }

  useEffect(() => {
    refreshCheck();
  }, []);

  const envRows = useMemo(() => {
    if (!check) return [];
    return Object.entries(check.env);
  }, [check]);

  async function sendTestText() {
    setLoading(true);
    setResult(null);
    const response = await fetch("/api/whatsapp/test-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message })
    });
    const data = await response.json();
    setResult(JSON.stringify(data, null, 2));
    setLoading(false);
  }

  async function sendTemplate() {
    setLoading(true);
    setResult(null);
    const bodyParameters = templateParams
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const response = await fetch("/api/whatsapp/send-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: templateTo,
        templateName,
        languageCode: templateLanguage,
        bodyParameters
      })
    });
    const data = await response.json();
    setResult(JSON.stringify(data, null, 2));
    setLoading(false);
  }

  async function sendPending() {
    setLoading(true);
    setResult(null);
    const response = await fetch("/api/whatsapp/send-pending", { method: "POST" });
    const data = await response.json();
    setResult(JSON.stringify(data, null, 2));
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 text-safety-green" size={22} />
          <div>
            <h2 className="text-lg font-bold">Production connection check</h2>
            <p className="mt-1 text-sm text-slate-600">
              Use this page after adding WhatsApp environment variables in Vercel or local .env.local.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {envRows.map(([key, value]) => (
            <StatusLine key={key} ok={Boolean(value)} label={`${key}: ${String(value)}`} />
          ))}
        </div>

        <Button className="mt-4 w-full gap-2" onClick={refreshCheck} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />} Refresh check
        </Button>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <Webhook className="mt-1 text-safety-green" size={22} />
          <div>
            <h2 className="text-lg font-bold">Meta webhook callback</h2>
            <p className="mt-1 text-sm text-slate-600">Paste this callback URL into Meta App Dashboard → WhatsApp → Configuration.</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-100 p-3 text-xs break-all text-slate-700">
          {check?.webhookUrl ?? "Loading..."}
        </div>
        <p className="mt-3 text-xs text-slate-500">Use the same verify token as WHATSAPP_VERIFY_TOKEN.</p>
      </Card>

      <Card>
        <div className="flex items-start gap-3">
          <MessageCircle className="mt-1 text-safety-green" size={22} />
          <div>
            <h2 className="text-lg font-bold">Send live test text</h2>
            <p className="mt-1 text-sm text-slate-600">
              This works only when WhatsApp credentials are valid and the conversation window allows free-form text.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-2xl border border-slate-200 p-3 text-sm" placeholder="60123456789" value={to} onChange={(event) => setTo(event.target.value)} />
          <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm" value={message} onChange={(event) => setMessage(event.target.value)} />
          <Button className="w-full gap-2" onClick={sendTestText} disabled={loading || !to}>
            <Send size={18} /> Send test text
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Send approved template</h2>
        <p className="mt-1 text-sm text-slate-600">Use this for closure updates or reports outside the service conversation window.</p>
        <div className="mt-4 space-y-3">
          <input className="w-full rounded-2xl border border-slate-200 p-3 text-sm" placeholder="Recipient phone, e.g. 60123456789" value={templateTo} onChange={(event) => setTemplateTo(event.target.value)} />
          <input className="w-full rounded-2xl border border-slate-200 p-3 text-sm" placeholder="Template name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
          <input className="w-full rounded-2xl border border-slate-200 p-3 text-sm" placeholder="Language code, e.g. en_US" value={templateLanguage} onChange={(event) => setTemplateLanguage(event.target.value)} />
          <input className="w-full rounded-2xl border border-slate-200 p-3 text-sm" placeholder="Comma separated body parameters" value={templateParams} onChange={(event) => setTemplateParams(event.target.value)} />
          <Button className="w-full gap-2" onClick={sendTemplate} disabled={loading || !templateTo || !templateName}>
            <Send size={18} /> Send template
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Send pending WhatsApp notifications</h2>
        <p className="mt-1 text-sm text-slate-600">Processes pending records in the notifications table where channel = whatsapp.</p>
        <Button className="mt-4 w-full gap-2" onClick={sendPending} disabled={loading}>
          <Send size={18} /> Send pending queue
        </Button>
      </Card>

      {result && (
        <Card>
          <h2 className="text-lg font-bold">API result</h2>
          <pre className="mt-3 max-h-96 overflow-auto rounded-2xl bg-slate-950 p-3 text-xs text-slate-100">{result}</pre>
        </Card>
      )}

{check?.phoneNumberInfo ? (
  <Card>
    <h2 className="text-lg font-bold">Phone number info</h2>
    <pre className="mt-3 max-h-96 overflow-auto rounded-2xl bg-slate-100 p-3 text-xs text-slate-700">
      {JSON.stringify(check.phoneNumberInfo, null, 2)}
    </pre>
  </Card>
) : null}
    </div>
  );
}
