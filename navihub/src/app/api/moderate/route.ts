import { NextRequest, NextResponse } from "next/server";
import { moderateContent, getFlaggedCategories, ModerationResult } from "./moderation";

// Types for API request/response
interface ModerationRequest {
  content: string;
}

interface ModerationApiResponse {
  safe: boolean;
  message?: string;
  flaggedCategories?: string[];
}

/**
 * POST /api/moderate
 * Moderates content using OpenAI's moderation API
 * 
 * Request body: { content: string }
 * Response: { safe: boolean, message?: string, flaggedCategories?: string[] }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ModerationApiResponse>> {
  console.log("Moderation API called");
  
  try {
    // Parse request body
    let body: ModerationRequest;
    try {
      body = await request.json();
      console.log("Request body received:", { contentLength: body.content?.length });
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { safe: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate request
    if (!body.content || typeof body.content !== "string") {
      console.log("Invalid content:", typeof body.content);
      return NextResponse.json(
        { safe: false, message: "Content is required and must be a string" },
        { status: 400 }
      );
    }

    // Check if content is empty or only whitespace
    if (body.content.trim().length === 0) {
      return NextResponse.json(
        { safe: false, message: "Content cannot be empty" },
        { status: 400 }
      );
    }

    // Check if API key is present
    console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);
    console.log("OPENAI_API_KEY starts with sk-:", process.env.OPENAI_API_KEY?.startsWith("sk-"));

    // Call OpenAI moderation API
    let moderationResult: ModerationResult;
    try {
      console.log("Calling OpenAI moderation API...");
      moderationResult = await moderateContent(body.content);
      console.log("Moderation result:", { flagged: moderationResult.flagged });
    } catch (moderationError) {
      console.error("Moderation error:", moderationError);
      const errorMessage = moderationError instanceof Error ? moderationError.message : "Unknown error";
      
      // Check for specific error types
      if (errorMessage.includes("API key")) {
        return NextResponse.json(
          { safe: false, message: "Server configuration error. Please contact support." },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { safe: false, message: `Moderation failed: ${errorMessage}` },
        { status: 500 }
      );
    }

    // Check if content was flagged
    if (moderationResult.flagged) {
      const flaggedCategories = getFlaggedCategories(moderationResult);
      return NextResponse.json({
        safe: false,
        message: "Your content contains inappropriate material and cannot be posted.",
        flaggedCategories,
      });
    }

    // Content is safe
    console.log("Content is safe, returning success");
    return NextResponse.json({
      safe: true,
    });
  } catch (error) {
    console.error("Moderation API route error:", error);

    return NextResponse.json(
      { safe: false, message: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
