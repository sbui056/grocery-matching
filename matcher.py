#!/usr/bin/env python3
"""
Grocery Product Matching Pipeline

Matches products from Store A (Walmart, 233K items) to Store B (Wegmans, 55K
items) using a hybrid TF-IDF + OpenAI embedding + LLM approach.

The pipeline follows the industry-standard entity matching architecture:
  1. Pre-processing   — normalize names, extract brand/size, filter categories
  2. Category blocking — restrict comparisons to compatible categories
  3. Candidate gen     — TF-IDF (lexical) + embeddings (semantic) → top-20 each
  4. Multi-signal score — composite of TF-IDF, embedding, brand, size, Jaccard
  5. LLM adjudication  — gpt-5.4-nano verifies all viable candidates
  6. Output            — CSV of (item_id_A, item_id_B) matches

Usage:
    pip install -r requirements.txt
    python matcher.py

Output:
    output/product_matches.csv             — final match list
    output/product_matches_diagnostic.csv  — detailed scores for review
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

import pandas as pd

from src.blocking import assign_blocks
from src.candidates import (
    compute_embeddings,
    generate_embedding_candidates,
    generate_tfidf_candidates,
    merge_candidates,
)
from src.config import OUTPUT_DIR, OpenAIConfig, PipelineConfig
from src.llm_matcher import run_llm_adjudication
from src.preprocessing import load_and_preprocess
from src.scoring import score_candidates
from src.utils import logger


def build_output(
    scored: dict[int, list[dict[str, Any]]],
    llm_results: dict[int, dict[str, Any]],
    store_a: pd.DataFrame,
    config: PipelineConfig,
) -> pd.DataFrame:
    """
    Combine scoring and LLM results into the final match list.

    A match is included if:
    - LLM selected a candidate with high/medium confidence, OR
    - Composite score >= threshold AND LLM confidence is low

    Returns a DataFrame with columns for the output and diagnostic CSVs.
    """
    a_data = store_a.set_index("item_id")[
        ["name", "brand", "size_str"]
    ].to_dict("index")

    rows: list[dict[str, Any]] = []

    for id_a, cands in scored.items():
        if not cands:
            continue

        top_cand = cands[0]
        llm = llm_results.get(id_a, {})
        llm_match_id = llm.get("item_id_b_llm")
        llm_confidence = llm.get("llm_confidence", "none")

        # Determine the best match: prefer LLM choice, fallback to top scorer
        if llm_match_id is not None:
            # LLM made a selection — use it
            selected_b = llm_match_id
            # Find the corresponding candidate for its scores
            selected_cand = next(
                (c for c in cands if c["item_id_b"] == selected_b),
                top_cand,
            )
        else:
            # LLM said no match
            selected_b = top_cand["item_id_b"]
            selected_cand = top_cand

        composite = selected_cand["composite"]

        # Apply inclusion rules — trust the LLM verdict
        include = False
        if llm_match_id is not None and llm_confidence in ("high", "medium"):
            include = True
        elif llm_match_id is not None and composite >= config.llm_low_confidence_threshold:
            include = True

        if not include:
            continue

        a_info = a_data.get(id_a, {})
        rows.append({
            "item_id_A": id_a,
            "item_id_B": selected_b,
            "name_A": a_info.get("name", ""),
            "brand_A": a_info.get("brand", ""),
            "size_A": a_info.get("size_str", ""),
            "name_B": selected_cand.get("name_b", ""),
            "brand_B": selected_cand.get("brand_b", ""),
            "size_B": selected_cand.get("size_b", ""),
            "composite_score": composite,
            "tfidf_score": selected_cand.get("tfidf", 0.0),
            "embedding_score": selected_cand.get("embedding", 0.0),
            "brand_score": selected_cand.get("brand", 0.0),
            "size_score": selected_cand.get("size", 0.0),
            "jaccard_score": selected_cand.get("jaccard", 0.0),
            "llm_match": llm_confidence if llm_match_id else "none",
        })

    df = pd.DataFrame(rows)

    # Deduplicate: keep highest-scoring match per item_id_A
    if not df.empty:
        df = (
            df.sort_values("composite_score", ascending=False)
            .drop_duplicates(subset="item_id_A", keep="first")
            .sort_values("composite_score", ascending=False)
            .reset_index(drop=True)
        )

    return df


async def main() -> None:
    """Run the full product matching pipeline."""
    pipeline_start = time.time()
    config = PipelineConfig()
    oai_config = OpenAIConfig.from_yaml()

    # ------------------------------------------------------------------
    # Phase 1: Pre-processing
    # ------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 1: Pre-processing")
    logger.info("=" * 60)
    store_a, store_b = load_and_preprocess()

    # ------------------------------------------------------------------
    # Phase 2: Category blocking
    # ------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 2: Category blocking")
    logger.info("=" * 60)
    blocks = assign_blocks(store_a, store_b)

    # ------------------------------------------------------------------
    # Phase 3: Candidate generation (TF-IDF + Embeddings)
    # ------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 3: Candidate generation")
    logger.info("=" * 60)

    # 3a: TF-IDF
    tfidf_cands = generate_tfidf_candidates(blocks, config)

    # 3b: Embeddings via OpenAI API
    logger.info("Computing embeddings via OpenAI API...")
    embeddings_a, ids_a = await compute_embeddings(
        store_a, "store_a", oai_config, config,
    )
    embeddings_b, ids_b = await compute_embeddings(
        store_b, "store_b", oai_config, config,
    )
    embedding_cands = generate_embedding_candidates(
        blocks, embeddings_a, ids_a, embeddings_b, ids_b, config,
    )

    # 3c: Merge
    merged = merge_candidates(tfidf_cands, embedding_cands)

    # ------------------------------------------------------------------
    # Phase 4: Multi-signal scoring
    # ------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 4: Multi-signal scoring")
    logger.info("=" * 60)
    scored = score_candidates(merged, store_a, store_b, config)

    # ------------------------------------------------------------------
    # Phase 5: LLM adjudication
    # ------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 5: LLM adjudication")
    logger.info("=" * 60)
    llm_results = await run_llm_adjudication(
        scored, store_a, oai_config, config,
    )

    # ------------------------------------------------------------------
    # Phase 6: Output
    # ------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("PHASE 6: Output")
    logger.info("=" * 60)
    matches_df = build_output(scored, llm_results, store_a, config)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Match list CSV
    match_path = OUTPUT_DIR / "product_matches.csv"
    matches_df[["item_id_A", "item_id_B"]].to_csv(match_path, index=False)
    logger.info("Match list saved: %s (%d matches)", match_path, len(matches_df))

    # Diagnostic CSV
    diagnostic_path = OUTPUT_DIR / "product_matches_diagnostic.csv"
    matches_df.to_csv(diagnostic_path, index=False)
    logger.info("Diagnostic saved: %s", diagnostic_path)

    # Summary
    elapsed = time.time() - pipeline_start
    logger.info("=" * 60)
    logger.info("PIPELINE COMPLETE")
    logger.info("=" * 60)
    logger.info("Total matches: %d", len(matches_df))
    logger.info("Elapsed time: %.1f minutes", elapsed / 60)

    if not matches_df.empty:
        logger.info("Match quality breakdown:")
        logger.info("  LLM high confidence:   %d", (matches_df["llm_match"] == "high").sum())
        logger.info("  LLM medium confidence: %d", (matches_df["llm_match"] == "medium").sum())
        logger.info("  LLM low confidence:    %d", (matches_df["llm_match"] == "low").sum())
        logger.info("  Score-only (no LLM):   %d", (matches_df["llm_match"] == "none").sum())

    if len(matches_df) == 0:
        logger.warning("WARNING: No matches found. Check thresholds in config.")


if __name__ == "__main__":
    asyncio.run(main())
