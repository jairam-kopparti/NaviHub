
/*
  Moderation System v2.0 - Judge Ready Refactor
  Developed for NaviHub
  
  Logic:
  1. Input Sanitization (HTML strip, whitespace trim)
  2. Validation (Length checks) - Medium Severity
  3. Spam Detection (Repeated chars, caps spam, link spam) - Medium Severity
  4. Content filtering (Tiered word lists with regex matching) - High/Medium/Low
  
  Severity Levels:
  - clean: No issues found.
  - low: Minor issues (mild insults), allowed but flagged.
  - medium: Moderate issues (profanity, spam, validation failures), blocked.
  - high: Severe issues (hate speech, explicit content), blocked immediately.
*/

export type ModerationResult = {
  allowed: boolean;
  severity: "clean" | "low" | "medium" | "high";
  flagged: boolean;
  reason?: string;
  category?: "severe" | "explicit" | "profanity" | "mild" | "spam" | "validation" | "clean";
  matchedWord?: string; // Internal logging only
};

// --- Word Lists ---

// Severe: Hate speech, slurs, threats, severe harassment
const severeWords = [
  "nigger", "nigga", "n1gger", "n1gga", "ni99er", "negro", "coon", "monkey", "ape",
  "chink", "chingchong", "gook", "zipperhead",
  "spic", "wetback", "beaner",
  "kike", "heeb",
  "raghead", "sandnigger", "camel jockey",
  "gypsy",
  "faggot", "fag", "f@g", "f@ggot", "dyke", "tranny", "trannie", "shemale", "no homo",
  "christfag", "muslim pig", "islamist pig", "jew rat", "jewish pig",
  "retard", "r3tard", "retarded", "autist", "spaz", "downie",
  "kill yourself", "kys", "ky5", "go die", "die bitch", "hang yourself",
  "shoot yourself", "i will kill you", "you should die",
  "rape", "rapist", "molest", "molester", "pedo", "pedophile", "groomer",
  "subhuman", "vermin", "parasite", "filth", "trash human",
  "nazi", "neo nazi", "hitler", "kkk", "white power", "gas the jews"
];

// Explicit: Sexual content
const explicitWords = [
  "sex", "sexual", "porn", "porno", "pornographic",
  "nude", "nudes", "naked",
  "boob", "boobs", "tits", "tit",
  "penis", "vagina", "dick", "cock", "pussy",
  "blowjob", "handjob", "cum", "orgasm",
  "masturbate", "masturbation"
];

// Profanity: General swearing, strong insults
const profanityWords = [
  "fuck", "fucked", "fucking", "fucker", "fuckers", "fuk", "fuq", "f*ck", "f**k",
  "shit", "shitty", "bullshit", "shithead", "sh1t", "sh!t",
  "ass", "asshole", "assholes", "a$$", "a55hole",
  "bitch", "bitches", "bitching", "b1tch", "biatch", "b!tch",
  "bastard", "prick", "jerk",
  "cunt", "slut", "whore", "hoe", "thot",
  "damn", "dammit", "hell",
  "wtf", "stfu", "omfg", "lmfao"
];

// Mild Insults: Allowed but flagged
const mildInsults = [
  "dumbass", "jackass", "moron", "idiot", "stupid", "loser", "trash", "garbage", "scum",
  "ugly", "fat", "hate", "hateful"
];

// --- Helper Functions ---

/**
 * Normalizes text to avoid bypass attempts (e.g. "h3ll0" -> "hello")
 * Converts to lowercase, replaces leetspeak, removes non-alpha chars.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[@!]/g, "i")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/[^a-z\s]/g, " ") // Keep only letters and spaces
    .replace(/\s+/g, " ")     // Collapse multiple spaces
    .trim();
}

/**
 * Escapes regex special characters
 */
function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strips HTML tags to prevent injection and bypass via hidden tags
 */
function stripHtml(text: string): string {
  if (!text) return "";
  return text.replace(/<[^>]*>?/gm, ""); 
}

// --- Precompiled Regex Patterns for Performance ---

// Function to compile word list into a single regex (with word boundaries)
const compileWordList = (words: string[]) => {
  const normalizedWords = words.map(w => normalizeText(w)).filter(Boolean);
  
  if (normalizedWords.length === 0) return null;
  
  // Sort by length (descending) to match longer phrases first
  // e.g. match "bad word" before "bad"
  const pattern = normalizedWords.sort((a, b) => b.length - a.length)
    .map(w => escapeRegex(w))
    .join('|');
    
  return new RegExp(`\\b(${pattern})\\b`, 'i');
};

const severeRegex = compileWordList(severeWords);
const explicitRegex = compileWordList(explicitWords);
const profanityRegex = compileWordList(profanityWords);
const mildRegex = compileWordList(mildInsults);


// --- Spam Detection Logic ---

function checkSpam(text: string): { isSpam: boolean; reason?: string } {
  // 1. Excessive repeated characters
  // Matches any character repeated 9 or more times (total 10+)
  // e.g., "loooooooool"
  if (/(.)\1{9,}/.test(text)) {
    return { isSpam: true, reason: 'Excessive repeated characters' };
  }

  // 2. Excessive caps (only for longer texts)
  // Logic: Only counts A-Z characters vs total length of LETTERS ONLY (ignoring spaces/punctuation)
  if (text.length > 20) {
    const capsMatch = text.match(/[A-Z]/g);
    const lettersMatch = text.match(/[A-Za-z]/g);
    
    if (capsMatch && lettersMatch) {
      const capsCount = capsMatch.length;
      const lettersCount = lettersMatch.length;
      
      // If > 70% of letters are capitalized, flag as spam
      if (lettersCount > 0 && (capsCount / lettersCount) > 0.7) {
        return { isSpam: true, reason: 'Excessive capitalization' };
      }
    }
  }

  // 3. Repeated word spam
  // Checks if any single word makes up > 60% of the text (min 5 words)
  const words = text.toLowerCase().split(/\s+/);
  if (words.length > 5) {
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    for (const count of wordCounts.values()) {
      if (count > words.length * 0.6) {
         return { isSpam: true, reason: 'Repeated word spam' };
      }
    }
  }

  // 4. Link spam limit
  // Simple check for occurrences of "http" or "www"
  const linkCount = (text.match(/http|www\./gi) || []).length;
  if (linkCount > 3) {
    return { isSpam: true, reason: 'Too many links' };
  }

  return { isSpam: false };
}

// --- Main Moderation Function ---

export function moderateContent(rawText: string): ModerationResult {
  // 1. Basic Validation (Empty / Too Long)
  if (!rawText || rawText.trim().length === 0) {
    return { 
      allowed: false, 
      severity: "medium",  // Validations treated as medium severity per requirements
      flagged: true, 
      reason: 'Empty content',
      category: 'validation'
    };
  }

  const MAX_LENGTH = 2000;
  if (rawText.length > MAX_LENGTH) {
    return { 
      allowed: false, 
      severity: "medium", 
      flagged: true, 
      reason: 'Content too long',
      category: 'validation'
    };
  }

  // 2. Sanitization
  // Strip HTML tags before check to prevent bypass
  const sanitizedText = stripHtml(rawText);
  // Normalize text for word matching (handle leetspeak, remove symbols)
  const normalizedText = normalizeText(sanitizedText);


  // 3. Spam Check
  // We check spam on the original sanitized text (preserving cases) and not normalized text
  const spamCheck = checkSpam(sanitizedText);
  if (spamCheck.isSpam) {
    return {
      allowed: false,
      severity: "medium", 
      flagged: true,
      reason: spamCheck.reason,
      category: 'spam'
    };
  }


  // 4. Content Content Filtering (Severe -> Explicit -> Profanity -> Mild)

  // Level 1: Severe (Block Immediately)
  if (severeRegex) {
    const match = severeRegex.exec(normalizedText);
    if (match) {
      return {
        allowed: false,
        severity: "high",
        flagged: true,
        reason: 'Hate speech or severe harassment detected',
        category: 'severe',
        matchedWord: match[0]
      };
    }
  }

  // Level 2: Explicit (Block Immediately)
  if (explicitRegex) {
    const match = explicitRegex.exec(normalizedText);
    if (match) {
      return {
        allowed: false,
        severity: "high",
        flagged: true,
        reason: 'Explicit content detected',
        category: 'explicit',
        matchedWord: match[0]
      };
    }
  }

  // Level 3: Profanity (Block)
  if (profanityRegex) {
    const match = profanityRegex.exec(normalizedText);
    if (match) {
      return {
        allowed: false,
        severity: "medium",
        flagged: true,
        reason: 'Profanity detected',
        category: 'profanity',
        matchedWord: match[0]
      };
    }
  }

  // Level 4: Mild Insults (Allow but flag)
  if (mildRegex) {
    const match = mildRegex.exec(normalizedText);
    if (match) {
      return {
        allowed: true, // Only flagged, not blocked
        severity: "low",
        flagged: true,
        reason: 'Mild insult detected',
        category: 'mild',
        matchedWord: match[0]
      };
    }
  }

  // 5. Clean
  return { 
    allowed: true, 
    severity: "clean", 
    flagged: false,
    reason: 'Content is clean',
    category: 'clean'
  };
}
