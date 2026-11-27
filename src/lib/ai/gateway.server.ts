import { createOpenAI } from "@ai-sdk/openai";

import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id.server";

const LOVABLE_CHAT_MODEL = "openai/gpt-6-astra";
const OPENAI_CHAT_MODEL = "gpt-4o-mini";

export function hasAiProviderKey() {
  return Boolean(process.env["LOVABLE_API_KEY"] || process.env["OPENAI_API_KEY"]);
}

export function createAiModel(request: Request) {
  const lovableApiKey = process.env["LOVABLE_API_KEY"];
  if (lovableApiKey) {
    const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: lovableApiKey,
      headers: {
        "Lovable-API-Key": lovableApiKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      fetch: runIdFetch.fetch,
    });
    return {
      model: provider.responses(LOVABLE_CHAT_MODEL),
      providerOptions: responsesOptions,
      runIdFetch,
    };
  }

  const openAiApiKey = process.env["OPENAI_API_KEY"];
  if (!openAiApiKey) throw new Error("LOVABLE_API_KEY ou OPENAI_API_KEY manquant.");

  const provider = createOpenAI({ apiKey: openAiApiKey });
  return {
    model: provider.responses(OPENAI_CHAT_MODEL),
    providerOptions: openAiResponsesOptions,
  };
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

export const openAiResponsesOptions = {
  openai: {
    store: false,
  },
} as const;

/** Basic guard on incoming chat payloads. */
export function limitMessages<T extends { role: string }>(messages: unknown): T[] | null {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) return null;
  if (JSON.stringify(messages).length > 60_000) return null;
  return messages.slice(-20) as T[];
}
