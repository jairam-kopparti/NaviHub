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

export async function GET(request:NextRequest,{params}:{params:{message:string}}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const {searchParams} = new URL(request.url)
    const message = searchParams.get("message")
    let text
    if(message){
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
      return NextResponse.json(500)
    }
  }
}
