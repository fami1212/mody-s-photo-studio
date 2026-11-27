import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageCircle, RotateCw, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Props = {
  mode: "booking" | "admin";
  title: string;
  greeting: string;
};

const adminToolLabels: Record<string, string> = {
  list_bookings: "Réservations",
  summarize_bookings: "Résumé des réservations",
  update_booking_status: "Mise à jour du statut",
  list_folders: "Dossiers et liens",
  create_whatsapp_draft: "Brouillon WhatsApp",
};

export function ChatPanel({ mode, title, greeting }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [bookingHistory, setBookingHistory] = useState<string[]>([]);
  const [handoff, setHandoff] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(() => {
    const options = {
      api: mode === "booking" ? "/api/public/chat/booking" : "/api/admin-chat",
      headers: async (): Promise<Record<string, string>> => {
        if (mode !== "admin") return {};
        const { data } = await supabase.auth.getSession();
        return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
      },
    };
    if (mode === "booking") {
      return new DefaultChatTransport({
        ...options,
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { message: messages[messages.length - 1] },
        }),
      });
    }
    return new DefaultChatTransport(options);
  }, [mode]);
  const { messages, sendMessage, status, error, stop, regenerate } = useChat({ transport });
  const busy = status === "submitted" || status === "streaming";
  const whatsappText = bookingHistory.join("\n");
  const whatsappHref = useMemo(
    () =>
      `https://wa.me/212645914716?text=${encodeURIComponent(
        `Bonjour Mody, je souhaite continuer ma demande avec vous.${whatsappText ? `\n${whatsappText}` : ""}`,
      )}`,
    [whatsappText],
  );

  useEffect(() => {
    if (!open || !messagesRef.current) return;
    messagesRef.current.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "auto" });
  }, [messages, open, status]);

  function sendChatMessage(rawText: string) {
    const text = rawText.trim().slice(0, 1000);
    if (!text || busy) return;

    if (mode === "booking") {
      const history = [...bookingHistory, text];
      setBookingHistory(history);
      if (history.length >= 2) {
        setHandoff(true);
        setInput("");
        return;
      }
    }
    sendMessage({ text });
    setInput("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendChatMessage(input);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Fermer l'assistant" : title}
        aria-expanded={open}
        aria-controls="mody-chat-panel"
        className="chat-panel-launcher"
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-5" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">{open ? "Fermer" : title}</span>
      </button>

      {open && (
        <section
          id="mody-chat-panel"
          role="dialog"
          aria-labelledby="mody-chat-title"
          className="chat-panel-window"
        >
          <header className="chat-panel-header">
            <span className="chat-panel-avatar" aria-hidden="true">
              <MessageCircle className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="mody-chat-title" className="truncate font-display text-lg uppercase">
                {title}
              </h2>
              <p className="chat-panel-subtitle">
                {mode === "booking" ? "Tarifs & contact" : "Espace d’assistance"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="chat-panel-close"
              aria-label="Fermer la conversation"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </header>

          <div
            ref={messagesRef}
            className="chat-panel-messages"
            role="log"
            aria-label="Conversation"
            aria-live="polite"
            aria-busy={busy}
          >
            <div className="chat-panel-message chat-panel-message-assistant">
              <p className="chat-panel-bubble">{greeting}</p>
            </div>
            {mode === "booking" && messages.length === 0 && !error && (
              <div className="chat-panel-suggestions" aria-label="Questions suggérées">
                <p>Pour commencer</p>
                <button
                  type="button"
                  onClick={() =>
                    sendChatMessage("Quels sont les tarifs pour une séance en studio ?")
                  }
                  disabled={busy}
                >
                  Tarifs studio
                </button>
                <button
                  type="button"
                  onClick={() => sendChatMessage("Quelles sont les formules pour un mariage ?")}
                  disabled={busy}
                >
                  Mariage & baptême
                </button>
                <button
                  type="button"
                  onClick={() => sendChatMessage("Comment réserver une séance photo ?")}
                  disabled={busy}
                >
                  Réserver une séance
                </button>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-panel-message ${
                  message.role === "user"
                    ? "chat-panel-message-user"
                    : "chat-panel-message-assistant"
                }`}
              >
                <div
                  className={`chat-panel-bubble ${
                    message.role === "user" ? "chat-panel-bubble-user" : ""
                  }`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type === "text") return <span key={index}>{part.text}</span>;
                    if (part.type.startsWith("tool-")) {
                      const toolName = part.type.slice("tool-".length);
                      const label = adminToolLabels[toolName] ?? "Action";
                      const state = "state" in part ? part.state : undefined;
                      const statusText =
                        state === "output-available"
                          ? `${label} : terminé`
                          : state === "output-error"
                            ? `${label} : erreur`
                            : `${label} : en cours…`;
                      return (
                        <span
                          key={index}
                          className="my-1 block text-xs text-muted-foreground"
                          role="status"
                        >
                          · {statusText}
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}

            {status === "submitted" && (
              <p className="chat-panel-status" role="status">
                Préparation de la réponse…
              </p>
            )}
            {mode === "booking" && (handoff || error) ? (
              <div className="chat-panel-support">
                <p>
                  {handoff
                    ? "Pour poursuivre votre demande, Mody vous répond directement sur WhatsApp."
                    : "L’assistant est momentanément indisponible. Vous pouvez réessayer ou continuer directement avec Mody."}
                </p>
                {error && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void regenerate()}
                  >
                    <RotateCw aria-hidden="true" />
                    Réessayer
                  </Button>
                )}
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="chat-panel-whatsapp"
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Continuer sur WhatsApp
                </a>
              </div>
            ) : error ? (
              <div className="chat-panel-error" role="alert">
                <p>L’assistant est indisponible. Votre message est conservé.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void regenerate()}
                >
                  <RotateCw aria-hidden="true" />
                  Réessayer
                </Button>
              </div>
            ) : null}
          </div>

          <form onSubmit={submit} className="chat-panel-composer">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
              placeholder="Écrivez votre message…"
              aria-label="Votre message"
              enterKeyHint="send"
              className="chat-panel-input"
            />
            {busy ? (
              <button
                type="button"
                onClick={stop}
                className="chat-panel-send chat-panel-stop"
                aria-label="Arrêter la réponse"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Envoyer le message"
                disabled={!input.trim()}
                className="chat-panel-send"
              >
                <Send className="size-4" aria-hidden="true" />
              </button>
            )}
          </form>
        </section>
      )}
    </>
  );
}
