// moderation.ts

export const bannedWords: string[] = [
  // General profanity
  "fuck", "fucked", "fucking", "fucker", "fuckers",
  "shit", "shitty", "bullshit", "shithead",
  "ass", "asshole", "assholes", "dumbass", "jackass",
  "bitch", "bitches", "bitching",
  "bastard", "prick", "jerk", "moron", "idiot", "stupid",

  // Sexual / explicit
  "sex", "sexual", "porn", "porno", "pornographic",
  "nude", "nudes", "naked",
  "boob", "boobs", "tits", "tit",
  "penis", "vagina", "dick", "cock", "pussy",
  "blowjob", "handjob", "cum", "orgasm",
  "masturbate", "masturbation",

  // Harassment / insults
  "loser", "trash", "garbage", "scum",
  "hate", "hateful",
  "kill", "die", "dead",
  "ugly", "fat", "stupid",
  "retard", "retarded",

  // Crude language / variations
  "wtf", "stfu", "omfg", "lmfao",
  "damn", "dammit", "hell",

  // Common evasive spellings
  "fuk", "fuq", "f*ck", "f**k",
  "sh1t", "sh!t",
  "a$$", "biatch",
  "d1ck", "p*ssy"
]


function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[@$!]/g, 'a')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/0/g, 'o')
    .replace(/[^a-z\s]/g, '')
}

export function moderateContent(text: string) {
  if (!text || text.trim().length === 0) {
    return { allowed: false, reason: 'Empty content' }
  }

  if (text.length > 1000) {
    return { allowed: false, reason: 'Content too long' }
  }

  const normalized = normalizeText(text)

  for (const word of bannedWords) {
    if (normalized.includes(word)) {
      return {
        allowed: false,
        reason: 'Inappropriate language detected',
      }
    }
  }

  // simple spam check (same character repeated)
  if (/(.)\1{10,}/.test(text)) {
    return {
      allowed: false,
      reason: 'Spam detected',
    }
  }

  return { allowed: true }
}
