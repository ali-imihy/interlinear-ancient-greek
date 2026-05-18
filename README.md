# Ancient Greek Interlinear Reader

A full-stack reading tool that parses Ancient Greek passages into interlinear vocabulary and morphology.

## Features
- Paste Ancient Greek passages
- Preserves original line breaks
- Uses Morpheus for morphological parsing
- Uses LSJ-based dictionary data for glosses
- Adds fallback handling for particles, elision, and Homeric forms
- Click words to inspect lemma and morphology
- Shows unresolved words for review

## Architecture
Next.js frontend
→ Next.js API route
→ Dockerized Morpheus API on Fly.io
→ LSJ dictionary lookup + gloss overrides
→ Interlinear reader UI

## Limitations
- Some LSJ glosses are noisy or poorly ranked
- Homeric forms sometimes require curated overrides
- Future work: user notes, better gloss ranking, saved passages
