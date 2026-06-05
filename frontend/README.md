# Frontend

Case study page for the grocery product matching pipeline. Built with Next.js, TypeScript, and hand-built CSS data visualizations.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Data

The page reads from `public/data/summary.json` and `public/data/matches.json`. To regenerate from the pipeline output:

```bash
python prepare_data.py
```
