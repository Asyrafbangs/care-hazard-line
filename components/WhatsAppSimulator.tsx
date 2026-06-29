"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

type ChatItem = {
  direction: "user" | "bot";
  text: string;
};

export function WhatsAppSimulator() {
  const [phoneNumber, setPhoneNumber] = useState("60123456789");
  const [profileName, setProfileName] = useState("Test Worker");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [chat, setChat] = useState<ChatItem[]>([
    {
      direction: "bot",
      text: "Type anything to start. Use RESET to restart the test profile. Use PHOTO button when the bot asks for a photo."
    }
  ]);

  async function sendMessage(image = false) {
    const messageText = image ? text || "Photo attached" : text.trim();
    if (!image && !messageText) return;

    setLoading(true);
    setChat((items) => [...items, { direction: "user", text: image ? `📷 ${messageText}` : messageText }]);
    setText("");

    try {
      const response = await fetch("/api/whatsapp/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, profileName, text: messageText, image })
      });
      const result = await response.json();

      setChat((items) => [
        ...items,
        { direction: "bot", text: result.ok ? result.reply : `Error: ${result.error ?? "Unknown error"}` }
      ]);
    } catch (error) {
      setChat((items) => [...items, { direction: "bot", text: error instanceof Error ? error.message : "Unknown error" }]);
    } finally {
      setLoading(false);
    }
  }

  const quickReplies = ["1", "2", "3", "4", "YES", "MENU", "STATUS", "RESET"];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-3xl bg-white p-4 shadow-card ring-1 ring-slate-100">
        <label className="text-sm font-semibold text-slate-700">
          Test phone number
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-safety-green"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          WhatsApp profile name
          <input
            value={profileName}
            onChange={(event) => setProfileName(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-safety-green"
          />
        </label>
      </div>

      <div className="min-h-[420px] space-y-3 rounded-3xl bg-[#e9f5ef] p-4 shadow-inner">
        {chat.map((item, index) => (
          <div key={`${item.direction}-${index}`} className={`flex ${item.direction === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm shadow-sm ${
                item.direction === "user" ? "bg-safety-green text-white" : "bg-white text-slate-800"
              }`}
            >
              {item.text}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => setText(reply)}
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
          >
            {reply}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-slate-100">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type message here..."
          rows={3}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-safety-green"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button disabled={loading} onClick={() => sendMessage(false)}>
            Send text
          </Button>
          <Button disabled={loading} variant="secondary" onClick={() => sendMessage(true)}>
            Send photo
          </Button>
        </div>
      </div>
    </div>
  );
}
