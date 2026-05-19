"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const SAMPLE_TEXT = "μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος";

const SAMPLE_PASSAGES = [
  {
    title: "Homer, Iliad 1.1",
    text: "μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος",
  },
  {
    title: "John 1:1",
    text: "Ἐν ἀρχῇ ἦν ὁ λόγος\nκαὶ ὁ λόγος ἦν πρὸς τὸν θεόν\nκαὶ θεὸς ἦν ὁ λόγος",
  },
  {
    title: "Homer, Iliad 1.1-16",
    text: `μῆνιν ἄειδε θεὰ Πηληϊάδεω Ἀχιλῆος
οὐλομένην, ἣ μυρί’ Ἀχαιοῖς ἄλγε’ ἔθηκε,
πολλὰς δ’ ἰφθίμους ψυχὰς Ἄϊδι προΐαψεν
ἡρώων, αὐτοὺς δὲ ἑλώρια τεῦχε κύνεσσιν
οἰωνοῖσί τε πᾶσι, Διὸς δ’ ἐτελείετο βουλή,
ἐξ οὗ δὴ τὰ πρῶτα διαστήτην ἐρίσαντε
Ἀτρεΐδης τε ἄναξ ἀνδρῶν καὶ δῖος Ἀχιλλεύς.
τίς τ’ ἄρ σφωε θεῶν ἔριδι ξυνέηκε μάχεσθαι;
Λητοῦς καὶ Διὸς υἱός· ὃ γὰρ βασιλῆϊ χολωθεὶς
νοῦσον ἀνὰ στρατὸν ὄρσε κακήν, ὀλέκοντο δὲ λαοί,
οὕνεκα τὸν Χρύσην ἠτίμασεν ἀρητῆρα
Ἀτρεΐδης· ὃ γὰρ ἦλθε θοὰς ἐπὶ νῆας Ἀχαιῶν
λυσόμενός τε θύγατρα φέρων τ’ ἀπερείσι’ ἄποινα,
στέμματ’ ἔχων ἐν χερσὶν ἑκηβόλου Ἀπόλλωνος
χρυσέῳ ἀνὰ σκήπτρῳ, καὶ λίσσετο πάντας Ἀχαιούς,
Ἀτρεΐδα δὲ μάλιστα δύω, κοσμήτορε λαῶν·`
  },
];

function getShortGloss(gloss) {
  if (!gloss) return "definition pending";

  return gloss
    .split(",")
    .slice(0, 2)
    .join(", ")
    .trim();
}

function getFullGloss(token) {
  if (!token) return "definition not found";

  const parseGloss = token.parses?.find(
    (parse) => parse.gloss && parse.gloss !== "definition not found"
  )?.gloss;

  return token.shortDef || parseGloss || "definition not found";
}

function splitMorphology(morphology) {
  if (!morphology) return [];
  return morphology.trim().split(" ").filter(Boolean);
}

function summarizeUnresolved(tokens) {
  const map = new Map();

  tokens.filter(isUnresolvedToken).forEach((token) => {
    const key = token.surface;

    if (!map.has(key)) {
      map.set(key, {
        surface: token.surface,
        count: 1,
        token,
      });
    } else {
      map.get(key).count += 1;
    }
  });

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function isUnresolvedToken(token) {
  if (!token) return false;

  return (
    token.status === "not_found" ||
    token.status === "parsed_no_gloss" ||
    !token.lemma ||
    token.shortDef === "not found" ||
    token.shortDef === "definition not found"
  );
}



export default function AncientGreekInterlinearParserDemo() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [lines, setLines] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [passageTitle, setPassageTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [savedPassages, setSavedPassages] = useState([]);
  const [isLoadingPassages, setIsLoadingPassages] = useState(false);

  const flatTokens = lines.flat();
  const parsedTokens = flatTokens.filter((token) => token.lemma).length;
  const totalWords = flatTokens.length;
  const unresolvedTokens = summarizeUnresolved(flatTokens);

  const clearParsedOutput = () => {
    setLines([]);
    setSelectedToken(null);
    setError(null);
    setSaveMessage(null);
  };

  const loadSamplePassage = (sampleText) => {
    setText(sampleText);
    clearParsedOutput();
  };

  const loadSavedPassages = async () => {
    setIsLoadingPassages(true);
  
    try {
      const response = await fetch("/api/passages");
  
      if (!response.ok) {
        throw new Error("Failed to load passages");
      }
  
      const data = await response.json();
      setSavedPassages(data.passages ?? []);
    } catch (error) {
      setError("Could not load saved passages.");
    } finally {
      setIsLoadingPassages(false);
    }
  };

  const parseWithApi = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedToken(null);

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Parser request failed");
      }

      const data = await response.json();

      // Preferred new response shape: { lines: [[token, token], [token]] }
      // Fallback old response shape: { tokens: [token, token] }
      setLines(data.lines ?? [data.tokens ?? []]);
    } catch (err) {
      setError("Could not parse the text. Make sure Morpheus/Docker is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const savePassage = async () => {
    if (!text.trim()) return;
  
    setIsSaving(true);
    setSaveMessage(null);
  
    try {
      const response = await fetch("/api/passages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: passageTitle.trim() || "Untitled Passage",
          originalText: text,
          parsedJson: {
            lines,
          },
        }),
      });
  
      if (!response.ok) {
        throw new Error("Save failed");
      }
  
      const data = await response.json();
  
      setSaveMessage(`Saved: ${data.passage.title}`);
    } catch (error) {
      setSaveMessage("Could not save passage.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTokenClick = (token) => {
    if (!token.lemma) return;
    setSelectedToken(token);
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-6 text-stone-900">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 border-b border-stone-300 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Ancient Greek Interlinear</h1>
          <p className="mt-1 text-sm text-stone-600">
            Paste Greek, parse morphology, and inspect possible lemmas inline.
          </p>
        </header>

        <section className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
            <label htmlFor="sample-passage" className="text-stone-500">
              sample:
            </label>
            <select
              id="sample-passage"
              defaultValue=""
              onChange={(event) => {
                if (!event.target.value) return;
                loadSamplePassage(event.target.value);
                event.target.value = "";
              }}
              className="h-8 rounded-sm border border-stone-300 bg-white px-2 text-sm shadow-none outline-none focus:border-stone-500"
            >
              <option value="">choose passage...</option>
              {SAMPLE_PASSAGES.map((passage) => (
                <option key={passage.title} value={passage.text}>
                  {passage.title}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              clearParsedOutput();
            }}
            className="min-h-24 resize-y rounded-sm border-stone-300 bg-white font-serif text-xl leading-relaxed shadow-none focus-visible:ring-stone-400"
            placeholder="Paste Ancient Greek here..."
          />

          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
            <Button
              onClick={parseWithApi}
              disabled={isLoading || !text.trim()}
              className="h-8 rounded-sm px-3"
            >
              {isLoading ? "Parsing..." : "Parse Greek"}
            </Button>

            <input
              value={passageTitle}
              onChange={(event) => setPassageTitle(event.target.value)}
              placeholder="Passage title"
              className="h-8 w-48 rounded-sm border border-stone-300 bg-white px-2 text-sm outline-none focus:border-stone-500"
            />

            <Button
              onClick={savePassage}
              disabled={isSaving || lines.flat().length === 0}
              variant="outline"
              className="h-8 rounded-sm px-3"
            >
              {isSaving ? "Saving..." : "Save Passage"}
            </Button>

            {saveMessage && (
              <span className="text-stone-600">{saveMessage}</span>
            )}

            <Button
              onClick={loadSavedPassages}
              variant="outline"
              className="h-8 rounded-sm px-3"
            >
              {isLoadingPassages ? "Loading..." : "Load Saved"}
            </Button>

            <button
              type="button"
              onClick={() => loadSamplePassage(SAMPLE_TEXT)}
              className="underline-offset-2 hover:underline"
            >
              reset sample
            </button>

            {totalWords > 0 && (
              <span>
                {parsedTokens}/{totalWords} words parsed
              </span>
            )}

            {error && <span className="text-red-700">{error}</span>}
          </div>
        </section>

        {savedPassages.length > 0 && (
          <section className="mb-5 rounded-sm border border-stone-300 bg-white p-4 text-sm shadow-sm">
            <h2 className="mb-3 font-semibold text-stone-800">Saved Passages</h2>

            <div className="space-y-2">
              {savedPassages.map((passage) => (
                <button
                  key={passage.id}
                  type="button"
                  onClick={() => {
                    setText(passage.originalText);
                    setPassageTitle(passage.title);
                    clearParsedOutput();
                  }}
                  className="block w-full rounded-sm border border-stone-200 px-3 py-2 text-left hover:border-stone-500"
                >
                  <div className="font-medium text-stone-900">{passage.title}</div>
                  <div className="truncate text-xs text-stone-500">
                    {passage.originalText}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-sm border border-stone-300 bg-white px-5 py-6 shadow-sm">
          {isLoading ? (
            <p className="text-sm italic text-stone-500">Parsing passage...</p>
          ) : flatTokens.length === 0 ? (
            <p className="text-sm italic text-stone-500">
              Parsed words will appear here. Click “Parse Greek” to begin.
            </p>
          ) : (
            <div className="space-y-7 font-serif text-[1.35rem]">
              {lines.map((line, lineIndex) => (
                <div key={lineIndex} className="min-h-[3.4rem] leading-[3.4rem]">
                  {line.length === 0 ? (
                    <div className="h-5" />
                  ) : (
                    line.map((token, tokenIndex) => {
                      const hasEntry = Boolean(token.lemma);
                      const isSelected =
                        selectedToken?.surface === token.surface &&
                        selectedToken?.lemma === token.lemma;
                      const hasMultipleParses = token.parses?.length > 1;

                      return (
                        <button
                          key={`${token.surface}-${lineIndex}-${tokenIndex}`}
                          type="button"
                          onClick={() => handleTokenClick(token)}
                          className={`group relative mx-1 inline-flex min-w-[4.5rem] flex-col items-center align-top leading-tight transition ${
                            hasEntry ? "cursor-pointer" : "cursor-default opacity-60"
                          }`}
                        >
                          <span
                            className={`border-b px-1 pb-0.5 text-2xl ${
                              isSelected
                                ? "border-stone-900 bg-stone-200 shadow-sm"
                                : hasEntry
                                ? "border-stone-300 group-hover:border-stone-900"
                                : "border-red-200 text-red-700"
                            }`}
                          >
                            {token.surface}
                          </span>

                          <span className="mt-1 max-w-[8rem] truncate text-center font-sans text-[0.72rem] leading-tight text-stone-600">
                            {hasEntry ? getShortGloss(token.shortDef || token.lemma) : "not found"}
                          </span>

                          {hasMultipleParses && (
                            <span className="mt-0.5 font-sans text-[0.62rem] text-stone-400">
                              {token.parses.length} parses
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="mt-4 rounded-sm border border-stone-300 bg-[#fffdf8] p-4 text-sm shadow-sm">
          {!selectedToken ? (
            <p className="text-stone-500">Click a parsed word to see lemma, gloss, and morphology.</p>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-stone-200 pb-4">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-serif text-4xl font-semibold leading-none">
                    {selectedToken.surface}
                  </span>
                  <span className="rounded-sm bg-stone-100 px-2 py-1 text-xs uppercase tracking-wide text-stone-500">
                    selected word
                  </span>
                </div>

                <dl className="grid gap-2 text-sm sm:grid-cols-[5rem_1fr]">
                  <dt className="text-stone-500">surface</dt>
                  <dd className="font-serif text-lg">{selectedToken.surface}</dd>

                  <dt className="text-stone-500">lemma</dt>
                  <dd className="font-serif text-lg">{selectedToken.lemma}</dd>

                  <dt className="text-stone-500">gloss</dt>
                  <dd className="text-stone-800">{getFullGloss(selectedToken)}</dd>
                </dl>
              </div>

              <div>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Possible parses
                </h2>

                {selectedToken.parses?.length > 0 ? (
                  <div className="space-y-2">
                    {selectedToken.parses.map((parse, index) => {
                      const morphologyParts = splitMorphology(parse.morphology);

                      return (
                        <div
                          key={`${parse.lemma}-${parse.morphology}-${index}`}
                          className="rounded-sm border border-stone-200 bg-white p-3"
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="rounded-sm font-normal">
                              {parse.partOfSpeech || "unknown"}
                            </Badge>
                            <span className="text-xs text-stone-400">parse {index + 1}</span>
                          </div>

                          {morphologyParts.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {morphologyParts.map((part) => (
                                <span
                                  key={`${parse.lemma}-${parse.morphology}-${part}`}
                                  className="rounded-sm bg-stone-100 px-2 py-1 text-xs text-stone-700"
                                >
                                  {part}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-stone-500">No morphology listed.</p>
                          )}

                          {parse.gloss && parse.gloss !== getFullGloss(selectedToken) && (
                            <p className="mt-2 text-stone-500">Gloss: {parse.gloss}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-stone-500">No parse details available for this word.</p>
                )}
              </div>
            </div>
          )}
        </aside>

        {unresolvedTokens.length > 0 && (
          <section className="mt-4 rounded-sm border border-amber-300 bg-amber-50/60 p-4 text-sm shadow-sm">
            <div className="mb-2 flex flex-wrap items-baseline gap-2">
              <h2 className="font-semibold text-amber-900">Unresolved words</h2>
              <span className="text-amber-800">
                {unresolvedTokens.length} word{unresolvedTokens.length === 1 ? "" : "s"} need review
              </span>
            </div>

            <p className="mb-3 text-amber-800">
              These words either failed to parse or parsed without a useful gloss.
            </p>

            <div className="flex flex-wrap gap-2">
              {unresolvedTokens.map((item, index) => (
                <button
                  key={`${item.surface}-unresolved-${index}`}
                  type="button"
                  onClick={() => setSelectedToken(item.token)}
                  className="rounded-sm border border-amber-300 bg-white px-2 py-1 font-serif text-base text-amber-950 hover:border-amber-600"
                  title={item.token.status || "unresolved"}
                >
                  {item.surface}
                  {item.count > 1 && (
                    <span className="ml-1 text-xs text-amber-600">×{item.count}</span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
