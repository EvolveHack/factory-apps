"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
  error?: boolean;
}

interface Props {
  customer: string;
  agentName: string;
  greeting: string;
  suggestedQuestions: string[];
  showToolBadges: boolean;
}

export function Chat({ customer, agentName, greeting, suggestedQuestions, showToolBadges }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(`/helpdesk/${customer}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => !m.error).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "The agent could not answer. Please try again.");
      setMessages([...next, { role: "assistant", content: data.reply, tools: data.tools }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "The agent could not answer. Please try again.";
      setMessages([...next, { role: "assistant", content: msg, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      data-testid="chat"
      className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:h-[640px]"
    >
      <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
        <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: "var(--accent)" }}>
          {agentName.charAt(0)}
        </span>
        <div>
          <p className="text-sm font-semibold">{agentName}</p>
          <p className="text-xs text-neutral-500">{busy ? "Typing..." : "Online"}</p>
        </div>
      </div>

      <div ref={listRef} data-testid="chat-messages" className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <Bubble role="assistant" content={greeting} testId="chat-greeting" />
        {messages.map((m, i) => (
          <div key={i}>
            <Bubble role={m.role} content={m.content} error={m.error} testId={m.role === "user" ? "chat-message-user" : "chat-message-agent"} />
            {showToolBadges && m.tools && m.tools.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {m.tools.map((t) => (
                  <span key={t} data-testid="chat-tool-used" className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[11px] text-neutral-600">
                    Used {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div data-testid="chat-typing" className="flex gap-1 px-1 py-2">
            {[0, 1, 2].map((d) => (
              <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-neutral-300" style={{ animationDelay: `${d * 120}ms` }} />
            ))}
          </div>
        )}
      </div>

      {suggestedQuestions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-neutral-100 px-5 pt-3">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              type="button"
              data-testid="chat-suggestion"
              disabled={busy}
              onClick={() => send(q)}
              className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs text-neutral-700 hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 p-4"
      >
        <input
          data-testid="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question"
          className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button
          data-testid="chat-send"
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          Send
        </button>
      </form>
    </section>
  );
}

function Bubble({ role, content, error, testId }: { role: Message["role"]; content: string; error?: boolean; testId: string }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <p
        data-testid={testId}
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          mine ? "text-white" : error ? "bg-red-50 text-red-700" : "bg-neutral-100 text-neutral-900"
        }`}
        style={mine ? { background: "var(--accent)" } : undefined}
      >
        {content}
      </p>
    </div>
  );
}
