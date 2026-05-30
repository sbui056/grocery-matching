# Grocery Product Matching Pipeline

Matches products from **Store A (Walmart, 233K products)** to **Store B (Wegmans, 55K products)** using a hybrid TF-IDF + OpenAI embedding + LLM approach for competitive price indexing.

## Problem

When pricing products at a grocery store, we need to match each of our products to the closest equivalent sold by a competitor. Since UPC data is not available in either dataset, all matching relies on product attributes: **name, brand, size, description, and category**.

The pipeline handles two types of matches:
- **Exact matches** — same branded product at both stores (e.g., Heinz Ketchup 32 oz)
- **Non-exact matches** — private-label equivalents (e.g., Great Value Tomato Sauce ↔ Wegmans Tomato Sauce)

## Results

| Metric | Value |
|--------|-------|
| Total matches produced | **24,370** |
| LLM high confidence | 20,258 |
| LLM medium confidence | 3,986 |
| LLM low confidence | 126 |
| Private label cross-matches | 828 |
| Pipeline runtime | ~80 minutes |

## Approach

The pipeline follows an industry-standard entity matching architecture with six phases:

### 1. Pre-processing
- Normalize product names (lowercase, strip symbols, collapse whitespace)
- Extract brand from product names when `brand_raw` is missing (Store A: 54% → 80% fill rate)
- Extract size from names and `sizing_comp` JSON (Store A: 17% → 57% fill rate)
- Filter Store A to matchable categories (233K → 170K products)

### 2. Category Blocking
- Map Walmart categories to compatible Wegmans categories (12 blocks)
- Reduces candidate pairs from 9.4 billion to 4.1 billion

### 3. Dual Candidate Generation
- **TF-IDF** — bigram vectorization + cosine similarity for lexical matching (~40s)
- **OpenAI Embeddings** — `text-embedding-3-small` for semantic matching (~13 min, cached)
- Union of top-20 candidates from each method per product

### 4. Multi-Signal Scoring
Weighted composite of five signals:

| Signal | Weight |
|--------|--------|
| TF-IDF cosine similarity | 0.25 |
| Embedding cosine similarity | 0.25 |
| Brand match (with private-label cross-matching) | 0.25 |
| Size match (with unit conversion) | 0.15 |
| Name token Jaccard similarity | 0.10 |

### 5. LLM Adjudication
- `gpt-5.4-nano` via Azure OpenAI verifies all candidates scoring above threshold
- 5 products per API call, batched with async concurrency
- JSON mode for structured output, temperature=0 for determinism
- Checkpoint/resume via JSONL for fault tolerance

### 6. Output
- `output/product_matches.csv` — final match list (`item_id_A, item_id_B`)
- `output/product_matches_diagnostic.csv` — detailed scores for review

## Project Structure

```
better-basket/
├── matcher.py                 # Main entry point — runs the full pipeline
├── requirements.txt           # Python dependencies
├── openai_creds.yaml          # Azure OpenAI credentials (not tracked in git)
├── data/
│   ├── grocery_store_a_items_final.csv   # Store A (Walmart) — 233K products
│   └── grocery_store_b_items_final.csv   # Store B (Wegmans) — 55K products
├── src/
│   ├── config.py              # Credentials, constants, tunable parameters
│   ├── utils.py               # Logging, retry logic, size normalization
│   ├── preprocessing.py       # Name normalization, brand/size extraction
│   ├── blocking.py            # Category mapping and block assignment
│   ├── candidates.py          # TF-IDF + embedding candidate generation
│   ├── scoring.py             # Multi-signal composite scoring
│   └── llm_matcher.py         # Async LLM adjudication with checkpointing
├── output/
│   ├── product_matches.csv              # Final match list
│   └── product_matches_diagnostic.csv   # Detailed scores
└── checkpoints/               # Cached embeddings and LLM results (not tracked)
```

## Setup & Usage

### Prerequisites

- Python 3.10+
- Azure OpenAI credentials in `openai_creds.yaml`:

```yaml
openai:
  endpoint: <your-azure-openai-endpoint>
  api_key: <your-api-key>
  deployment_name: gpt-5.4-nano
```

### Install

```bash
pip install -r requirements.txt
```

### Run

```bash
python matcher.py
```

The pipeline will:
1. Load and preprocess both datasets (~15s)
2. Generate TF-IDF candidates (~40s)
3. Compute OpenAI embeddings (~13 min, cached after first run)
4. Score and rank candidates (~15s)
5. Run LLM adjudication (~75 min, checkpointed)
6. Write output CSVs

**Re-runs are fast** — embeddings are cached to `checkpoints/*.npy` and LLM results to `checkpoints/llm_results.jsonl`. To force a fresh run, delete the `checkpoints/` directory.

## Configuration

All tunable parameters are in `src/config.py`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `exclude_threshold` | 0.45 | Minimum composite score to send to LLM |
| `auto_include_threshold` | 0.60 | Score threshold for auto-inclusion without LLM |
| `llm_concurrency` | 30 | Max concurrent LLM API calls |
| `embedding_concurrency` | 10 | Max concurrent embedding API calls |
| `tfidf_top_k` | 20 | TF-IDF candidates per product |
| `embedding_top_k` | 20 | Embedding candidates per product |

## Design Decisions

1. **TF-IDF + Embeddings (not just one)** — TF-IDF excels at lexical matching ("Heinz Ketchup" ↔ "Heinz Ketchup"); embeddings catch semantic similarity. The union captures both.

2. **LLM as verifier, not generator** — Using the LLM to verify pre-filtered candidates (not to search 55K products) keeps API costs bounded at ~15K calls instead of millions.

3. **Private-label cross-matching** — Great Value (Walmart) ↔ Wegmans products get a 0.7 brand score (vs 1.0 for exact brand match), allowing them to surface when name/size/category align.

4. **Checkpoint/resume** — Embeddings cached to `.npy`, LLM results to `.jsonl`. A crashed run resumes from the last checkpoint instead of restarting.

5. **Category blocking** — Restricting comparisons to compatible categories (e.g., Frozen → Frozen, not Frozen → Wine) cuts the search space by 60% while maintaining recall.
