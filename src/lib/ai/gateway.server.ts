import { createOpenAI } from "@ai-sdk/openai";

import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id.server";

export const CHAT_MODEL = "openai/gpt-6-astra";

export function createGatewayModel(request: Request) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("LOVABLE_API_KEY manquant");
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return { model: provider.responses(CHAT_MODEL), runIdFetch };
}

export const responsesOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

/** Basic guard on incoming chat payloads. */
export function limitMessages<T extends { role: string }>(messages: unknown): T[] | null {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) return null;
  if (JSON.stringify(messages).length > 60_000) return null;
  return messages.slice(-20) as T[];
}
