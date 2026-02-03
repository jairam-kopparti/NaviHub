

export const bannedWords: string[] = [
  "fuck", "fucked", "fucking", "fucker", "fuckers",
  "shit", "shitty", "bullshit", "shithead",
  "ass", "asshole", "assholes", "dumbass", "jackass",
  "bitch", "bitches", "bitching",
  "bastard", "prick", "jerk", "moron", "idiot", "stupid",

  "sex", "sexual", "porn", "porno", "pornographic",
  "nude", "nudes", "naked",
  "boob", "boobs", "tits", "tit",
  "penis", "vagina", "dick", "cock", "pussy",
  "blowjob", "handjob", "cum", "orgasm",
  "masturbate", "masturbation",

  "loser", "trash", "garbage", "scum",
  "hate", "hateful",
  "kill", "die", "dead",
  "ugly", "fat", "stupid",
  "retard", "retarded",

  "wtf", "stfu", "omfg", "lmfao",
  "damn", "dammit", "hell",

  "fuk", "fuq", "f*ck", "f**k",
  "sh1t", "sh!t",
  "a$$", "biatch",
  "d1ck", "p*ssy",

  "nigger", "nigga", "n1gger", "n1gga", "ni99er",
  "negro",
  "coon",
  "monkey",
  "ape",

  "chink", "chingchong", "gook",
  "zipperhead",

  "spic", "wetback", "beaner",

  "kike",
  "heeb",

  "raghead", "sandnigger", "camel jockey",

  "gypsy",


  "faggot", "fag", "f@g", "f@ggot",
  "dyke",
  "tranny", "trannie",
  "shemale",
  "no homo",

  "christfag",
  "muslim pig",
  "islamist pig",
  "jew rat",
  "jewish pig",

  "bitch", "b1tch", "biatch",
  "cunt",
  "slut",
  "whore",
  "hoe",
  "thot",

  "retard", "r3tard", "retarded",
  "autist",
  "spaz",
  "downie",


  "kill yourself", "kys", "ky5",
  "go die",
  "die bitch",
  "hang yourself",
  "shoot yourself",
  "i will kill you",
  "you should die",

  "rape", "rapist",
  "molest", "molester",
  "pedo", "pedophile",
  "groomer",

  "subhuman",
  "vermin",
  "parasite",
  "filth",
  "scum",
  "trash human",

  "nazi", "neo nazi",
  "hitler",
  "kkk",
  "white power",
  "gas the jews",

  "n!gger", "n@gger",
  "f4g", "f@6",
  "c00n",
  "k1ke",
  "sp1c",
  "b!tch",
  "sh!thead",
  "a55hole"
]

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/[@!]/g, "i")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/[^a-z\s]/g, " ") // Replace non-alpha chars with space to preserve word boundaries
    .replace(/\s+/g, " ")     // Collapse multiple spaces
    .trim();
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
    const normalizedWord = normalizeText(word);
    if (!normalizedWord) continue;

    // Use word boundaries to check for whole words only
    // This prevents "class" from triggering "ass", or "skill" from triggering "kill"
    const regex = new RegExp(`\\b${normalizedWord}\\b`);
    
    if (regex.test(normalized)) {
      return {
        allowed: false,
        reason: 'Inappropriate language detected',
      }
    }
  }

  if (/(.)\1{10,}/.test(text)) {
    return {
      allowed: false,
      reason: 'Spam detected',
    }
  }

  return { allowed: true }
}

