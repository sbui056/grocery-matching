"""
Multi-signal scoring for product match candidates.

Combines five signals — TF-IDF similarity, embedding similarity, brand match,
size match, and name token Jaccard — into a single composite score to rank
candidates and select the top matches for LLM adjudication.
"""

from __future__ import annotations

from typing import Any

import pandas as pd
from rapidfuzz import fuzz

from src.config import (
    PipelineConfig,
    ScoringWeights,
    WALMART_PRIVATE_LABELS,
    WEGMANS_PRIVATE_LABELS,
)
from src.utils import logger, sizes_match

ALL_PRIVATE_LABELS = WALMART_PRIVATE_LABELS | WEGMANS_PRIVATE_LABELS

# ---------------------------------------------------------------------------
# Individual signal scorers
# ---------------------------------------------------------------------------


def brand_score(brand_a: str | None, brand_b: str | None) -> float:
    """
    Score brand compatibility between two products.

    1.0 for exact match, 0.7 for private-label cross-match,
    fuzzy ratio for partial matches, 0.3 when one/both unknown.
    """
    if not brand_a or not brand_b:
        return 0.3

    a_low = brand_a.lower().strip()
    b_low = brand_b.lower().strip()

    if a_low == b_low:
        return 1.0

    # Private-label cross-match (Great Value ↔ Wegmans)
    a_private = a_low in ALL_PRIVATE_LABELS
    b_private = b_low in ALL_PRIVATE_LABELS
    if a_private and b_private:
        return 0.7

    # Fuzzy brand similarity for partial matches (e.g., "L'Oreal Paris" vs "L'Oreal")
    ratio = fuzz.ratio(a_low, b_low) / 100.0
    if ratio > 0.8:
        return ratio

    return 0.0


def jaccard_score(name_a: str, name_b: str) -> float:
    """
    Compute Jaccard similarity of word token sets.

    Measures the overlap between the two product names at the word level,
    complementing TF-IDF which weights by inverse document frequency.
    """
    tokens_a = set(name_a.lower().split())
    tokens_b = set(name_b.lower().split())
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    return len(intersection) / len(union)


# ---------------------------------------------------------------------------
# Composite scoring
# ---------------------------------------------------------------------------


def score_candidates(
    merged_candidates: dict[int, dict[int, dict[str, float]]],
    store_a: pd.DataFrame,
    store_b: pd.DataFrame,
    config: PipelineConfig,
) -> dict[int, list[dict[str, Any]]]:
    """
    Compute composite scores for all candidate pairs and keep top-K per A item.

    For each Store A product and its merged candidates from TF-IDF and embeddings,
    computes a weighted composite score from five signals and returns the top-K
    candidates sorted by score.

    Args:
        merged_candidates: From candidates.merge_candidates().
        store_a: Preprocessed Store A DataFrame.
        store_b: Preprocessed Store B DataFrame.
        config: Pipeline configuration with scoring weights.

    Returns:
        Dict mapping item_id_A → list of scored candidate dicts:
        [{"item_id_b": int, "composite": float, "tfidf": float,
          "embedding": float, "brand": float, "size": float, "jaccard": float,
          "name_b": str, "brand_b": str, "size_b": str}, ...]
    """
    weights = config.scoring_weights
    top_k = config.scoring_top_k

    # Build lookup dicts for fast access
    a_data = store_a.set_index("item_id")[
        ["name_norm", "brand", "size_parsed"]
    ].to_dict("index")
    b_data = store_b.set_index("item_id")[
        ["name_norm", "brand", "size_parsed", "name", "size_str"]
    ].to_dict("index")

    scored: dict[int, list[dict[str, Any]]] = {}
    n_scored = 0

    for id_a, candidates in merged_candidates.items():
        a_info = a_data.get(id_a)
        if a_info is None:
            continue

        name_a = a_info["name_norm"]
        brand_a = a_info["brand"]
        size_a = a_info["size_parsed"]

        scored_list: list[dict[str, Any]] = []

        for id_b, scores in candidates.items():
            b_info = b_data.get(id_b)
            if b_info is None:
                continue

            tfidf = scores.get("tfidf", 0.0)
            emb = scores.get("embedding", 0.0)
            br = brand_score(brand_a, b_info["brand"])
            sz = sizes_match(size_a, b_info["size_parsed"])
            jac = jaccard_score(name_a, b_info["name_norm"])

            composite = (
                weights.tfidf * tfidf
                + weights.embedding * emb
                + weights.brand * br
                + weights.size * sz
                + weights.jaccard * jac
            )

            scored_list.append({
                "item_id_b": id_b,
                "composite": composite,
                "tfidf": tfidf,
                "embedding": emb,
                "brand": br,
                "size": sz,
                "jaccard": jac,
                "name_b": b_info.get("name", ""),
                "brand_b": b_info.get("brand", ""),
                "size_b": b_info.get("size_str", ""),
            })

        # Sort by composite score, keep top-K
        scored_list.sort(key=lambda x: x["composite"], reverse=True)
        scored[id_a] = scored_list[:top_k]
        n_scored += len(scored_list[:top_k])

    logger.info(
        "Scored %d A items, %d total candidate pairs (top-%d per item)",
        len(scored), n_scored, top_k,
    )

    # Log score distribution
    top_scores = [cands[0]["composite"] for cands in scored.values() if cands]
    if top_scores:
        import numpy as np
        arr = np.array(top_scores)
        logger.info(
            "Top-1 composite score distribution: "
            "min=%.3f, p25=%.3f, median=%.3f, p75=%.3f, max=%.3f",
            arr.min(),
            np.percentile(arr, 25),
            np.median(arr),
            np.percentile(arr, 75),
            arr.max(),
        )
        for threshold in [0.35, 0.45, 0.55, 0.65]:
            count = (arr >= threshold).sum()
            logger.info("  Score >= %.2f: %d items (%.1f%%)", threshold, count, 100 * count / len(arr))

    return scored
