import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const responseLog = (msg: string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

const getGeminiApiKeys = () => {
  const primary = process.env.GEMINI_AI_API_KEY?.trim() || "";
  const fallback = process.env.GEMINI_AI_API_KEY_SECOND?.trim() || "";
  return [primary, fallback].filter(Boolean);
};

const createGeminiModel = (apiKey: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
};

export async function POST(request: NextRequest) {
  try {
    const apiKeys = getGeminiApiKeys();
    if (apiKeys.length === 0) {
      return NextResponse.json({ error: "No Gemini API key is configured." }, { status: 500 });
    }

    const body: unknown = await request.json();
    let text = "";
    // helper to safely read string props from unknown objects
    const getStringProp = (obj: unknown, key: string): string | undefined => {
      if (!obj || typeof obj !== 'object') return undefined;
      const o = obj as Record<string, unknown>;
      const has = Object.prototype.hasOwnProperty.call(o, key);
      if (!has) return undefined;
      const v = o[key];
      return typeof v === 'string' ? v : undefined;
    };

    // normalize incoming body into a string message
    let messageContent: string | null = null;
    if (typeof body === 'string') {
      messageContent = body;
    } else {
      const fromMessage = getStringProp(body, 'message');
      const fromData = getStringProp(body, 'data');
      if (fromMessage) messageContent = fromMessage;
      else if (fromData) messageContent = fromData;
      else {
        try {
          messageContent = JSON.stringify(body);
        } catch {
          messageContent = String(body ?? '');
        }
      }
    }

    // Try to load system prompt from prompts/naviBot-system-prompt.md at repository root
    let systemInstruction = "Be concise and brief without withholding key details. Format using bullet points (using dashes) under headings if helpful. Keep a friendly, polite tone. DO NOT over-explain. Do not repeat the prompt. Ensure grammar is correct. Use actual line breaks instead of literal text '\\n'.";
    try {
      const promptsPath = path.join(process.cwd(), "prompts", "naviBot-system-prompt.md");
      const file = await readFile(promptsPath, "utf8");
      if (file && file.trim().length > 0) systemInstruction = file.trim();
    } catch (err) {
      console.warn("Could not read system prompt file, using fallback instruction.", (err as Error)?.message ?? err);
    }

    if (messageContent) {
      const finalPrompt = `${systemInstruction}\n\nUser Question / Context:\n${messageContent}`;
      let lastError: unknown = null;
      let textResult: string | null = null;
      let parsed: unknown = null;

      for (const [index, apiKey] of apiKeys.entries()) {
        try {
          const model = createGeminiModel(apiKey);
          const result = await model.generateContent(finalPrompt);
          const response = await result.response;
          textResult = response.text();
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

      if (!textResult) {
        throw lastError ?? new Error("Gemini failed to generate a response.");
      }
      text = textResult;

      // Try to parse model output as JSON per the system prompt. If it's valid JSON and matches
      // the expected shape, return it directly. Otherwise return a structured cannot_comply error.
      try {
        parsed = JSON.parse(text);
      } catch {
        // attempt to extract a JSON substring if the model wrapped it in prose or code fences
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
          try { parsed = JSON.parse(text.slice(start, end + 1)); } catch {}
        }
      }

      const isValidFormat = (obj: unknown): obj is Record<string, unknown> => {
        return !!obj && typeof obj === 'object' && (obj as Record<string, unknown>)['format_version'] === '1.0';
      };

      if (parsed && isValidFormat(parsed)) {
        return NextResponse.json(parsed);
      }

      // If parsing failed, return the required error JSON per the system prompt schema
      return NextResponse.json({ format_version: '1.0', error: 'cannot_comply', reason: 'Model did not return valid JSON' });
    } else {
      text = "I don't understand the question!";
    }

    responseLog(text);
    return NextResponse.json(text);
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    let reason = String(error ?? '');
    if (error && typeof error === 'object') {
      const e = error as Record<string, unknown>;
      if (typeof e['message'] === 'string') reason = e['message'] as string;
    }
    return NextResponse.json(`Error communicating with Gemini: ${reason || "please try again."}`);
  }
}
