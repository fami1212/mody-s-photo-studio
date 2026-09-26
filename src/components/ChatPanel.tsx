import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, Send, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { supabase } from "@/integrations/supabase/client";

type Props = {
  mode: "booking" | "admin";
  title: string;
  greeting: string;
};

export function ChatPanel({ mode, title, greeting }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: mode === "booking" ? "/api/public/chat/booking" : "/api/admin-chat",
        headers: async (): Promise<Record<string, string>> => {
          if (mode !== "admin") return {};
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
      }),
    [mode],
  );
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim().slice(0, 1000);
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fermer l'assistant" : title}
        className="fixed bottom-4 right-4 z-50 flex h-14 items-center gap-2 rounded-full border-2 border-foreground bg-primary px-5 font-bold text-primary-foreground shadow-[4px_4px_0_0_var(--color-foreground)]"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        <span className="hidden sm:inline">{open ? "Fermer" : title}</span>
      </button>
      {open && (
        <section className="fixed inset-x-3 bottom-20 z-50 flex max-h-[70vh] flex-col overflow-hidden rounded-3xl border-2 border-foreground bg-card text-foreground sm:inset-x-auto sm:right-4 sm:w-[400px]">
          <header className="border-b-2 border-foreground bg-foreground px-4 py-3 font-display text-lg uppercase tracking-tight text-background">
            {title}
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <p className="leading-relaxed">{greeting}</p>
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-foreground px-3 py-2 text-background"
                      : "whitespace-pre-wrap leading-relaxed"
                  }
                >
                  {m.parts.map((p, i) => {
                    if (p.type === "text") return <span key={i}>{p.text}</span>;
                    if (p.type.startsWith("tool-"))
                      return (
                        <span key={i} className="my-1 block text-xs text-muted-foreground">
                          · action en cours…
                        </span>
                      );
                    return null;
                  })}
                </div>
              </div>
            ))}
            {status === "submitted" && <p className="text-muted-foreground">…</p>}
            {error && <p className="text-destructive">Assistant indisponible pour le moment.</p>}
          </div>
          <form onSubmit={submit} className="flex gap-2 border-t-2 border-foreground p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              placeholder="Écrivez votre message…"
              className="min-w-0 flex-1 rounded-full border-2 border-foreground bg-background px-4 py-2 text-sm outline-none"
            />
            {busy ? (
              <button type="button" onClick={stop} className="rounded-full border-2 border-foreground px-3 text-xs font-bold">
                Stop
              </button>
            ) : (
              <button type="submit" aria-label="Envoyer" className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                <Send className="size-4" />
              </button>
            )}
          </form>
        </section>
      )}
    </>
  );
}
