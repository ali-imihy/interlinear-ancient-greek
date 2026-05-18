import { lookupDefinition } from "@/lib/lsj";

const ELISION_FALLBACKS = {
  "τ": "τε",
  "δ": "δέ",
  "γ": "γε",
  "ἀλλ": "ἀλλά",
  "οὐδ": "οὐδέ",
  "μηδ": "μηδέ",
  "κατ": "κατά",
  "ἀπ": "ἀπό",
  "ἐπ": "ἐπί",
  "στέμματ": "στέμματα",
  "ἀπερείσι": "ἀπερείσια",
  "ἄλγε": "ἄλγεα",
  "αλγε": "αλγεα",
  "νοῦσον": "νόσον",
  "νουσον": "νοσον",
  "οὔτ": "οὔτε",
  "ουτ": "ουτε",

  "οὐδ": "οὐδέ",
  "ουδ": "ουδε",

  "ἀλλ": "ἀλλά",
  "αλλ": "αλλα",

  "ἐπ": "ἐπί",
  "επ": "επι",

  "μετ": "μετά",
  "μεθ": "μετά",

  "ἕνεκ": "ἕνεκα",
  "ενεκ": "ενεκα",

  "ἐνθάδ": "ἐνθάδε",
  "ενθαδ": "ενθαδε",

  "μ": "με",

  "κ": "ἄν",
  "κε": "ἄν",
  "κεν": "ἄν",

  "μάλ": "μάλα",
  "μαλ": "μαλα",

  "πάντ": "πάντα",
  "παντ": "παντα",
  "φιλέουσ": "φιλέουσι",
"φιλεουσ": "φιλεουσι",

"ἔμεγ": "ἔμε",
"εμεγ": "εμε",

"ἅσσ": "ὅσσα",
"ασσ": "οσσα",

"ἔνθά": "ἔνθα",
"ενθα": "ενθα",

"μάστακ": "μάστακα",
"μαστακ": "μαστακα",

"ἀλάπαξ": "ἀλάπαξε",
"αλαπαξ": "αλαπαξε",
};




const MORPHEUS_URL = process.env.MORPHEUS_URL || "http://localhost:1500";

function cleanToken(word) {
  return word
    .normalize("NFC")
    .trim()
    .replace(/^[.,;·!?“”"'()[\]{}«»]+/g, "")
    .replace(/[.,;·!?“”"'()[\]{}«»]+$/g, "")
    .replace(/[’ʼ′`]+$/g, "")
    .normalize("NFC");
}

function shouldSkipToken(word) {
  const cleaned = cleanToken(word);
  return /^\d+$/.test(cleaned);
}

function getParseCandidates(word) {
  const cleaned = cleanToken(word);
  const lower = cleaned.toLowerCase();

  const candidates = [
    cleaned,
    lower,
    ELISION_FALLBACKS[cleaned],
    ELISION_FALLBACKS[lower],
  ].filter(Boolean);

  return [...new Set(candidates)];
}

function forceArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function textValue(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object" && "$" in value) return value.$;
  return null;
}

function buildMorphology(infl) {
  const parts = [
    textValue(infl?.tense),
    textValue(infl?.mood),
    textValue(infl?.voice),
    textValue(infl?.case),
    textValue(infl?.gend),
    textValue(infl?.num),
    textValue(infl?.pers),
  ];

  return parts.filter(Boolean).join(" ");
}

function dedupeParses(parses) {
  const seen = new Set();

  return parses.filter((parse) => {
    const key = [
      parse.lemma,
      parse.partOfSpeech,
      parse.morphology,
      parse.gloss,
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeMorpheusResponse(surface, data) {
  const rest = data?.RDF?.Annotation?.Body?.rest;
  const entries = forceArray(rest?.entry);

  const rawParses = entries.flatMap((entry) => {
    const lemma = textValue(entry?.dict?.hdwd);
    const partOfSpeech = textValue(entry?.dict?.pofs);
  
    return forceArray(entry?.infl).map((infl) => {
      const gloss = lookupDefinition(lemma, surface);
  
      return {
        lemma,
        partOfSpeech,
        morphology: buildMorphology(infl),
        gloss: gloss ?? "definition not found",
      };
    });
  });
  
  const parses = dedupeParses(rawParses);

  const fallbackGloss = lookupDefinition(null, surface);

  if (parses.length === 0 && fallbackGloss) {
    return {
      surface,
      lemma: surface,
      shortDef: fallbackGloss,
      status: "fallback_gloss",
      parses: [
        {
          lemma: surface,
          partOfSpeech: "unknown / override",
          morphology: "fallback gloss",
          gloss: fallbackGloss,
        },
      ],
    };
  }

  const bestGloss =
    lookupDefinition(parses[0]?.lemma, surface) ??
    fallbackGloss ??
    null;

  return {
    surface,
    lemma: parses[0]?.lemma ?? null,
    shortDef: bestGloss ?? parses[0]?.lemma ?? "not found",
    status:
      parses.length === 0
        ? "not_found"
        : bestGloss
        ? "parsed"
        : "parsed_no_gloss",
    parses,
  };
}

async function fetchMorpheus(candidate) {
  const url =
    `${MORPHEUS_URL}/analysis/word` +
    `?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(candidate)}`;

  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  return response.json();
}


async function parseWord(word) {
  const surface = cleanToken(word);
  if (!surface) return null;

  const candidates = getParseCandidates(word);

  for (const candidate of candidates) {
    const data = await fetchMorpheus(candidate);

    if (!data) continue;

    const parsed = normalizeMorpheusResponse(surface, data);

    if (parsed.parses.length > 0) {
      return parsed;
    }
  }

  const fallbackGloss = lookupDefinition(null, surface);

  if (fallbackGloss) {
    return {
      surface,
      lemma: surface,
      shortDef: fallbackGloss,
      status: "fallback_gloss",
      parses: [
        {
          lemma: surface,
          partOfSpeech: "unknown / override",
          morphology: "fallback gloss",
          gloss: fallbackGloss,
        },
      ],
    };
  }

  return {
    surface,
    lemma: null,
    shortDef: "not found",
    status: "not_found",
    parses: [],
  };
}

export async function POST(request) {
  const { text } = await request.json();

  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const lines = await Promise.all(
    rawLines.map(async (line) => {
      const words = line
        .split(/\s+/)
        .filter(Boolean)
        .filter((word) => !shouldSkipToken(word));

      const parsedWords = await Promise.all(words.map(parseWord));
      return parsedWords.filter(Boolean);
    })
  );

  return Response.json({
    lines,
    tokens: lines.flat(),
  });
}