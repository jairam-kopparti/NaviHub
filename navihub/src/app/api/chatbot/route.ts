import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_AI_API_KEY || "");
const responseLog = (msg:string) => {
  console.log(`[${new Date().toISOString()}] ${msg}`);
};

export async function POST(request:NextRequest) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    let message = await request.json()
    let text
    if(message){
    const systemInstruction = "Be concise and brief without withholding key details. Format using bullet points (using dashes) under headings if helpful. Keep a friendly, polite tone. DO NOT over-explain. Do not repeat the prompt. Ensure grammar is correct. Use actual line breaks instead of literal text '\\n'.";
    
    const finalPrompt = `${systemInstruction}\n\nUser Question / Context:\n${message}`;
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    text = response.text();
    } else{
      text="I don't understand the question!"
    }
    responseLog(text);
    return NextResponse.json(text)
  } catch (error:any) {
    console.error("Error communicating with Gemini:", error);
    return NextResponse.json(`Error communicating with Gemini: ${error.message || "please try again."}`)
  }
}
