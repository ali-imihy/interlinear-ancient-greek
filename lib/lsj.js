import fs from "fs";
import path from "path";
import { GLOSS_OVERRIDES } from "@/lib/glossOverrides";

const filePath = path.join(process.cwd(), "data", "lsj.json");

const raw = fs.readFileSync(filePath, "utf8");
export const LSJ = JSON.parse(raw);

export function normalizeGreek(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[σ]$/g, "ς")
    .toLowerCase();
}

export function lookupDefinition(lemma, surface = null) {
  const candidates = [surface, lemma].filter(Boolean);

  for (const word of candidates) {
    if (GLOSS_OVERRIDES[word]) {
      return GLOSS_OVERRIDES[word];
    }

    const normalized = normalizeGreek(word);

    if (GLOSS_OVERRIDES[normalized]) {
      return GLOSS_OVERRIDES[normalized];
    }

    if (LSJ[word]) {
      return LSJ[word].definitions.slice(0, 2).join(", ");
    }

    if (LSJ[normalized]) {
      return LSJ[normalized].definitions.slice(0, 2).join(", ");
    }
  }

  return null;
}