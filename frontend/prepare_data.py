#!/usr/bin/env python3
"""Prepare match data for the frontend by converting diagnostic CSV to JSON."""

import json
import random
from pathlib import Path

import pandas as pd

CSV_PATH = Path(__file__).parent.parent / "output" / "product_matches_diagnostic.csv"
OUT_PATH = Path(__file__).parent / "public" / "data"


def main() -> None:
    df = pd.read_csv(CSV_PATH)
    OUT_PATH.mkdir(parents=True, exist_ok=True)

    # --- Summary stats ---
    summary = {
        "totalMatches": len(df),
        "storeAProducts": 233_000,
        "storeBProducts": 55_000,
        "candidatePairsReduced": "9.4B → 4.1B",
        "pipelineRuntime": "~80 min",
        "confidence": {
            "high": int((df["llm_match"] == "high").sum()),
            "medium": int((df["llm_match"] == "medium").sum()),
            "low": int((df["llm_match"] == "low").sum()),
        },
        "scoreStats": {
            "mean": round(df["composite_score"].mean(), 3),
            "median": round(df["composite_score"].median(), 3),
            "min": round(df["composite_score"].min(), 3),
            "max": round(df["composite_score"].max(), 3),
            "p25": round(df["composite_score"].quantile(0.25), 3),
            "p75": round(df["composite_score"].quantile(0.75), 3),
        },
        "signalAverages": {
            "TF-IDF": round(df["tfidf_score"].mean(), 3),
            "Embedding": round(df["embedding_score"].mean(), 3),
            "Brand": round(df["brand_score"].mean(), 3),
            "Size": round(df["size_score"].mean(), 3),
            "Jaccard": round(df["jaccard_score"].mean(), 3),
        },
    }

    # --- Score distribution ---
    bins = [0, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01]
    labels = ["0–0.3", "0.3–0.4", "0.4–0.5", "0.5–0.6", "0.6–0.7", "0.7–0.8", "0.8–0.9", "0.9–1.0"]
    df["bucket"] = pd.cut(df["composite_score"], bins=bins, labels=labels)
    score_dist = [
        {"range": label, "count": int(df[df["bucket"] == label].shape[0])}
        for label in labels
    ]
    summary["scoreDistribution"] = score_dist

    # --- Top brand pairs ---
    bp = (
        df.groupby(["brand_A", "brand_B"])
        .size()
        .reset_index(name="count")
        .sort_values("count", ascending=False)
        .head(12)
    )
    summary["topBrandPairs"] = [
        {"brandA": row["brand_A"], "brandB": row["brand_B"], "count": int(row["count"])}
        for _, row in bp.iterrows()
    ]

    # --- Private label stats ---
    walmart_pl = {"great value", "equate", "freshness guaranteed", "marketside",
                  "sam's choice", "bettergoods", "parent's choice"}
    pl_matches = df[
        df["brand_A"].str.lower().isin(walmart_pl) & (df["brand_B"].str.lower() == "wegmans")
    ]
    summary["privateLabelMatches"] = len(pl_matches)

    with open(OUT_PATH / "summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    # --- Sample matches for browsing (curated + random) ---
    # Grab interesting examples from different categories
    samples = []

    # High confidence exact matches
    high_exact = df[
        (df["llm_match"] == "high")
        & (df["brand_score"] == 1.0)
        & (df["composite_score"] > 0.9)
    ].head(20)
    samples.append(high_exact)

    # Private label cross-matches
    pl_sample = pl_matches.sort_values("composite_score", ascending=False).head(20)
    samples.append(pl_sample)

    # Medium confidence
    med = df[df["llm_match"] == "medium"].sort_values("composite_score", ascending=False).head(20)
    samples.append(med)

    # Low confidence (interesting edge cases)
    low = df[df["llm_match"] == "low"].head(20)
    samples.append(low)

    # Random sample for variety
    remaining = df[~df.index.isin(pd.concat(samples).index)]
    rand_sample = remaining.sample(n=min(120, len(remaining)), random_state=42)
    samples.append(rand_sample)

    all_samples = pd.concat(samples).drop_duplicates(subset="item_id_A").head(200)

    matches = []
    for _, row in all_samples.iterrows():
        matches.append({
            "idA": int(row["item_id_A"]),
            "idB": int(row["item_id_B"]),
            "nameA": str(row["name_A"]),
            "nameB": str(row["name_B"]),
            "brandA": str(row["brand_A"]) if pd.notna(row["brand_A"]) else "",
            "brandB": str(row["brand_B"]) if pd.notna(row["brand_B"]) else "",
            "sizeA": str(row["size_A"]) if pd.notna(row["size_A"]) else "",
            "sizeB": str(row["size_B"]) if pd.notna(row["size_B"]) else "",
            "composite": round(float(row["composite_score"]), 4),
            "tfidf": round(float(row["tfidf_score"]), 4),
            "embedding": round(float(row["embedding_score"]), 4),
            "brand": round(float(row["brand_score"]), 4),
            "size": round(float(row["size_score"]), 4),
            "jaccard": round(float(row["jaccard_score"]), 4),
            "confidence": str(row["llm_match"]),
        })

    with open(OUT_PATH / "matches.json", "w") as f:
        json.dump(matches, f, indent=2)

    print(f"Generated {len(matches)} sample matches and summary stats")
    print(f"Output: {OUT_PATH}")


if __name__ == "__main__":
    main()
