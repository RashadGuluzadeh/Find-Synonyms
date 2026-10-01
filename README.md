# Find Synonyms

A fast, accessible word explorer: synonyms, antonyms, rhymes, related words, definitions and real usage examples, powered by the free [Datamuse API](https://www.datamuse.com/api/) and [Wiktionary](https://en.wiktionary.org/).

## Features

- **8 search types**: Synonyms, Similar meaning, Antonyms, Related, Describing (adjectives for a noun), Described (nouns for an adjective), Rhymes, Sounds like
- **Definitions** with part of speech, plus **example sentences** from Wiktionary with the word highlighted (each one can be read aloud)
- **Estimated English level (CEFR A1–C2)** next to the searched word and every result, with a level filter and an "Easiest first" sort. Levels are estimated from word frequency, not taken from an official CEFR list.
- **Autocomplete** suggestions with full keyboard support (↑ ↓ Enter Esc)
- **Filter** results by part of speech and **sort** by relevance, A→Z or length, with a relevance bar on each result
- **Click any result** to explore it. The **exploration path** (happy → bright → luminous) lets you jump back to any step
- **Export** the shown results: copy them, or download a TXT file or a CSV file (with levels and parts of speech)
- **Word of the day** and a **Surprise me** button for discovering new words
- **Favorites** and **recent searches**, saved locally and synced across tabs
- **Shareable URLs** (`?q=happy&mode=ant`) with working back/forward navigation
- **Pronunciation** through the browser's speech synthesis
- **Keyboard shortcuts**: `/` search, `1`–`8` search type, `F` favorite, `R` random word, `T` theme, `?` help
- **Light / dark theme**, a responsive layout with a sticky search bar on desktop, smooth animations, and reduced-motion support

## Getting started

Requires Node.js 20.19+.

```bash
npm install
npm run dev        # development server
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (with the full security headers)
```

## Security

- **Input validation**: queries are normalised and limited to letters, spaces, hyphens and apostrophes (max 50 characters). URL parameters and stored data go through the same validation.
- **Safe requests**: query strings are built with `URLSearchParams`, so parameters can't be injected. Requests are pinned to the Datamuse origin and sent with `credentials: "omit"` and `referrerPolicy: "no-referrer"`. They time out after 8 s, are aborted when superseded, and their content type and size are checked.
- **No HTML from APIs**: Wiktionary examples arrive as HTML. They are parsed in an inert `DOMParser` document, and only their plain text is kept.
- **Safe exports**: CSV cells are quoted, and cells that start with `= + - @` are neutralised to prevent spreadsheet formula injection. Download file names are sanitised.
- **Untrusted responses**: API data is validated at runtime before use. React escapes all output, and the app never uses `dangerouslySetInnerHTML`.
- **Content Security Policy**: production builds get a strict CSP `<meta>` (`default-src 'none'`, scripts and styles from `'self'` only, network access only to `api.datamuse.com` and `en.wiktionary.org`). The build also emits `dist/_headers` (Netlify / Cloudflare Pages) with the CSP plus `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` and `Cross-Origin-Opener-Policy`.
- **No third-party assets**: no external fonts, images or trackers.
- **Dependencies**: minimal and current (`npm audit` reports 0 vulnerabilities). No source maps are shipped.

## Tech stack

React 19 · TypeScript 5.9 · Vite 8 · Tailwind CSS 4
