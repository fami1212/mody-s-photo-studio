import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

import { getPublicChatFaqAnswer } from "@/lib/public-chat-faq";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTextPart(value: unknown): value is { type: "text"; text: string } {
  return isRecord(value) && value["type"] === "text" && typeof value["text"] === "string";
}

function getUserMessageText(body: unknown) {
  if (!isRecord(body) || !isRecord(body["message"])) return null;
  const message = body["message"];
  if (message["role"] !== "user" || !Array.isArray(message["parts"])) return null;

  const text = message["parts"]
    .filter(isTextPart)
    .map((part) => part.text)
    .join("\n")
    .trim();
  return text.length > 0 && text.length <= 1000 ? text : null;
}

export const Route = createFileRoute("/api/public/chat/booking")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const question = getUserMessageText(body);
        if (!question) return new Response("Message invalide", { status: 400 });

        const answer = getPublicChatFaqAnswer(question);
        const stream = createUIMessageStream({
          execute: ({ writer }) => {
            const textPartId = "faq-answer";
            writer.write({ type: "start" });
            writer.write({ type: "start-step" });
            writer.write({ type: "text-start", id: textPartId });
            writer.write({ type: "text-delta", id: textPartId, delta: answer });
            writer.write({ type: "text-end", id: textPartId });
            writer.write({ type: "finish-step" });
            writer.write({ type: "finish", finishReason: "stop" });
          },
        });

        return createUIMessageStreamResponse({ stream });
      },
    },
  },
});
