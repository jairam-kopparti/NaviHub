import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY);
const responseLog = (msg) =>
  fs.appendFileSync(
    "gemini-responses.log",
    `[${new Date().toISOString()}] ${msg}\n`,
  );
async function main(message) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const prompt = message;
    const result = await model.generateContent(prompt);

    const response = await result.response;
    const text = response.text();

    responseLog(text);
  } catch (error) {
    console.error("Error communicating with Gemini:", error.message);
  }
}

main("Why is the sky blue?");
