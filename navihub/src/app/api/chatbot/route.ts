import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const responseLog = (msg: string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

const FALLBACK_SYSTEM_PROMPT =
  "Be concise and brief without withholding key details. Format using bullet points (using dashes) under headings if helpful. Keep a friendly, polite tone. DO NOT over-explain. Do not repeat the prompt. Ensure grammar is correct. Use actual line breaks instead of literal text '\\n'.";

const PROMPT_CANDIDATES = [
  "navibot_system_prompt.md",
  "navibot_system_prompt",
  "naviBot-system-prompt.md",
  "navibot-system-prompt.md",
];

let cachedPrompt = "";
let cachedPromptMtime = 0;

const loadPrompt = async () => {
  for (const candidate of PROMPT_CANDIDATES) {
    const promptPath = path.join(process.cwd(), "prompts", candidate);
    try {
      const stat = await fs.stat(promptPath);
      if (cachedPrompt && cachedPromptMtime === stat.mtimeMs) return cachedPrompt;
      const content = await fs.readFile(promptPath, "utf-8");
      cachedPrompt = content;
      cachedPromptMtime = stat.mtimeMs;
      return content;
    } catch {
      // Try the next candidate.
    }
  }

  return FALLBACK_SYSTEM_PROMPT;
};

const getGeminiApiKeys = () => {
  const primary = process.env.GEMINI_AI_API_KEY?.trim() || "";
  const fallback = process.env.GEMINI_AI_API_KEY_SECOND?.trim() || "";
  return [primary, fallback].filter(Boolean);
};

const createGeminiModel = (apiKey: string, systemInstruction?: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-3-flash-preview", systemInstruction });
};

const tryParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { return JSON.parse(text.slice(start, end + 1)); } catch {}
    }
  }
  return null;
};

export async function POST(request: NextRequest) {
  try {
    const systemInstruction = await loadPrompt();
    const apiKeys = getGeminiApiKeys();
    if (apiKeys.length === 0) {
      return NextResponse.json({ error: "No Gemini API key is configured." }, { status: 500 });
    }

    const message = await request.json();
    let text: string | undefined = undefined;

    if (message) {
      const userPayload = typeof message === "string" ? message : JSON.stringify(message);
      const finalPrompt = `User Question / Context:\n${userPayload}`;
      let lastError: unknown = null;

      for (const [index, apiKey] of apiKeys.entries()) {
        try {
          const model = createGeminiModel(apiKey, systemInstruction);
          const result = await model.generateContent(finalPrompt);
          const response = await result.response;
          text = response.text();
          break;
        } catch (err) {
          lastError = err;
          const keyName = index === 0 ? "primary" : "secondary";
          console.warn(`Gemini ${keyName} API key failed, ${index < apiKeys.length - 1 ? "trying fallback" : "no fallback left"}.`, err);
          if (index === apiKeys.length - 1) {
            throw err;
          }
        }
      }

      if (!text) {
        throw lastError ?? new Error("Gemini failed to generate a response.");
      }

      const parsed = tryParseJson(text);
      if (parsed && typeof parsed === 'object' && (parsed as Record<string, unknown>)['format_version'] === '1.0') {
        return NextResponse.json(parsed);
      }

      return NextResponse.json({ format_version: '1.0', error: 'cannot_comply', reason: 'Model did not return valid JSON' });
    } else {
      text = "I don't understand the question!";
    }

    responseLog(String(text));
    return NextResponse.json(String(text));
  } catch (error: any) {
    console.error("Error communicating with Gemini:", error);
    let reason = String(error ?? '');
    if (error && typeof error === 'object') {
      const e = error as Record<string, unknown>;
      if (typeof e['message'] === 'string') reason = e['message'] as string;
    }
    return NextResponse.json(`Error communicating with Gemini: ${reason || "please try again."}`)
  }
}
