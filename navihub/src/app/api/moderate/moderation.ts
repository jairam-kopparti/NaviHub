// Types for moderation result
export interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

/**
 * Checks content for inappropriate material using OpenAI's moderation API
 * @param content - The text content to moderate
 * @returns Promise with moderation result
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not set in environment variables");
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  console.log("Making direct fetch to OpenAI moderations endpoint...");

  const response = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ input: content }),
  });

  console.log("OpenAI response status:", response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("OpenAI API error response:", errorData);
    
    if (response.status === 401) {
      throw new Error("Invalid OpenAI API key or insufficient permissions");
    }
    if (response.status === 429) {
      throw new Error("OpenAI rate limit exceeded. Please try again later.");
    }
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("OpenAI moderation response received:", { flagged: data.results?.[0]?.flagged });

  if (!data.results || data.results.length === 0) {
    throw new Error("No moderation results returned from OpenAI");
  }

  const result = data.results[0];
  
  return {
    flagged: result.flagged,
    categories: result.categories,
    category_scores: result.category_scores,
  };
}

/**
 * Checks if content is appropriate for posting
 * @param content - The text content to check
 * @returns Promise<boolean> - true if content is appropriate, false if flagged
 */
export async function isContentSafe(content: string): Promise<boolean> {
  const result = await moderateContent(content);
  return !result.flagged;
}

/**
 * Gets the flagged categories from a moderation result
 * @param result - The moderation result
 * @returns Array of flagged category names
 */
export function getFlaggedCategories(result: ModerationResult): string[] {
  const flagged: string[] = [];
  for (const [category, isFlagged] of Object.entries(result.categories)) {
    if (isFlagged) {
      flagged.push(category);
    }
  }
  return flagged;
}
