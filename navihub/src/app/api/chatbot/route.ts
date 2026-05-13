import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY || "");
const responseLog = (msg:string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

const FALLBACK_SYSTEM_PROMPT =
  "Be concise and brief without withholding key details. Format using bullet points (using dashes) under headings if helpful. Keep a friendly, polite tone. DO NOT over-explain. Do not repeat the prompt. Ensure grammar is correct. Use actual line breaks instead of literal text '\\n'.";

const PROMPT_CANDIDATES = [
  "navibot_system_prompt.md",
  "navibot_system_prompt",
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

const parseJsonIfPossible = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return text;
  try {
    return JSON.parse(trimmed);
  } catch {
    return text;
  }
};

export async function POST(request:NextRequest) {
  try {
    const systemInstruction = await loadPrompt();
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction,
    });
    const message = await request.json();
    let text;

    if (message) {
      const userPayload = typeof message === "string" ? message : JSON.stringify(message);
      const finalPrompt = `User Question / Context:\n${userPayload}`;
      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      text = response.text();
    } else {
      text = "I don't understand the question!";
    }

    responseLog(text);
    return NextResponse.json(parseJsonIfPossible(text));
  } catch (error:any) {
    console.error("Error communicating with Gemini:", error);
    return NextResponse.json(`Error communicating with Gemini: ${error.message || "please try again."}`)
  }
}
