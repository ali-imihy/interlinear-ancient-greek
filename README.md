# Ancient Greek Interlinear Reader

A full-stack Ancient Greek study platform that converts pasted Greek passages into interlinear vocabulary, lemmas, morphology, and clickable word-level analysis.

Originally inspired by NoDictionaries, but focused on Ancient Greek. Users are able to paste passages, parse them into word-level vocabulary, inspect possible morphological analyses, save passages, and create personal lemma-level notes for review.

## Live Demo

Live Site: **https://interlinear-ancient-greek.vercel.app/**

## Features

- Parse Ancient Greek word forms using a Dockerized Morpheus morphology API
- Click individual words to inspect lemma, gloss, part of speech, and morphology
- Look up definitions using LSJ-based lexical data
- Improve coverage with Greek normalization, particle handling, elision fallbacks, and curated Homeric gloss overrides
- Sign in with GitHub authentication
- Save, load, update, and delete personal passages
- Save personal notes by lemma, so notes apply across different inflected forms
- Review and edit saved vocabulary notes on a dedicated review page
- Display note indicators on words that already have saved notes

## Tech Stack

**Frontend**
- Next.js
- React
- Tailwind CSS

**Backend**
- Next.js API routes
- Prisma ORM
- Neon PostgreSQL
- Auth.js / NextAuth


**Language Processing**
- Morpheus / Perseids morphology API
- LSJ-based Greek-English dictionary data
- Custom Greek normalization and fallback handling

**Deployment**
- Vercel for the Next.js application
- Fly.io for the Dockerized Morpheus API
- Neon for hosted PostgreSQL

