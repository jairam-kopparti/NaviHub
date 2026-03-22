import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { appendFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY || "");
const responseLog = (msg:string) =>
  appendFileSync(
    "gemini-responses.log",
    `[${new Date().toISOString()}] ${msg}\n`,
  );

export async function POST(request:NextRequest) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    let message = await request.json()
    let text
    if(message){
    message+="Avoid returning special characters. Be as brief as possible without withholding any key details or information. Wherever there should be an enter or newline, output \n, the escape sequence for a newline, instead of creating an actual line break. When possible format with bullet points(dashes) under headings with colons next to them. DO NOT EVER INCLUDE BAD LANGUAGE in your responses. Keep a friendly and realistically polite tone. Don't go overboard. Make sure your response is grammatically correct."
    const result = await model.generateContent(message);
    const response = await result.response;
    text = response.text();
    } else{
      text="I don't understand the question!"
    }
    responseLog(text);
    return NextResponse.json(text)
  } catch (error:unknown) {
    if(error instanceof Error){
      console.error("Error communicating with Gemini:", error);
      return NextResponse.json(`Error communicating with gemini, please try again.`)
    }
  }
}
