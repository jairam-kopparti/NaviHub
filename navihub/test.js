import fs from "fs";

function normalizeText(text) {
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

function check(text) {
  const norm = normalizeText(text);
  fs.writeFileSync('./out.txt', norm + "\n");
}

check("This is a wonderful food truck sponsored by the very residents of NYC. It goes around street to street, selling food of all types of cuisines.");
