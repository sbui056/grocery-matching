"""
Candidate generation using dual TF-IDF and OpenAI embedding approaches.

For each Store A product, generates a shortlist of top-K candidate matches
from Store B using two complementary methods:
1. TF-IDF cosine similarity (fast, lexical matching)
2. OpenAI text-embedding-3-small cosine similarity (semantic matching)

The union of candidates from both methods is returned for scoring.
"""

from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Any

import httpx
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from tqdm import tqdm

from src.config import CHECKPOINT_DIR, OpenAIConfig, PipelineConfig
from src.utils import logger, retry_async

# ---------------------------------------------------------------------------
# Composite text for matching
# ---------------------------------------------------------------------------


def build_composite_text(df: pd.DataFrame) -> pd.Series:
    """
    Build a composite text string per product for vectorization.

    Combines normalized name, brand, and category information into
    a single string optimized for TF-IDF and embedding similarity.
    """
    parts = [df["name_norm"].fillna("")]
    if "brand" in df.columns:
        parts.append(df["brand"].fillna(""))
    if "category_1" in df.columns:
        parts.append(df["category_1"].fillna(""))
    if "category_2" in df.columns:
        parts.append(df["category_2"].fillna(""))
    return parts[0].str.cat(parts[1:], sep=" ").str.strip()


# ---------------------------------------------------------------------------
# TF-IDF candidate generation
# ---------------------------------------------------------------------------


def generate_tfidf_candidates(
    blocks: dict[str, tuple[pd.DataFrame, pd.DataFrame]],
    config: PipelineConfig,
) -> dict[int, list[tuple[int, float]]]:
    """
    Generate top-K candidates per Store A product using TF-IDF cosine similarity.

    For each category block, fits a TF-IDF vectorizer on the union of A and B
    composite texts, then computes chunked cosine similarity to find the most
    similar B products for each A product.

    Args:
        blocks: Dict of block_name → (a_subset, b_subset) from blocking.
        config: Pipeline configuration with TF-IDF parameters.

    Returns:
        Dict mapping item_id_A → list of (item_id_B, tfidf_score) sorted
        by descending score. Each A item has up to config.tfidf_top_k candidates.
    """
    logger.info("Generating TF-IDF candidates...")
    all_candidates: dict[int, list[tuple[int, float]]] = {}

    for block_name, (a_block, b_block) in tqdm(blocks.items(), desc="TF-IDF blocks"):
        if a_block.empty or b_block.empty:
            continue

        # Build composite texts
        texts_a = build_composite_text(a_block).values
        texts_b = build_composite_text(b_block).values
        ids_a = a_block["item_id"].values
        ids_b = b_block["item_id"].values

        # Fit TF-IDF on the union of A and B texts
        all_texts = list(texts_a) + list(texts_b)
        vectorizer = TfidfVectorizer(
            ngram_range=config.tfidf_ngram_range,
            max_features=config.tfidf_max_features,
            sublinear_tf=True,
            min_df=2,
        )
        tfidf_matrix = vectorizer.fit_transform(all_texts)

        # Split back into A and B matrices
        n_a = len(texts_a)
        matrix_a = tfidf_matrix[:n_a]
        matrix_b = tfidf_matrix[n_a:]

        # Compute cosine similarity in chunks to manage memory
        chunk_size = config.tfidf_chunk_size
        for start in range(0, n_a, chunk_size):
            end = min(start + chunk_size, n_a)
            sim_chunk = cosine_similarity(matrix_a[start:end], matrix_b)

            for i in range(sim_chunk.shape[0]):
                global_idx = start + i
                item_id_a = int(ids_a[global_idx])

                # Get top-K indices
                top_k = min(config.tfidf_top_k, sim_chunk.shape[1])
                top_indices = np.argpartition(sim_chunk[i], -top_k)[-top_k:]
                top_indices = top_indices[np.argsort(sim_chunk[i][top_indices])[::-1]]

                candidates = [
                    (int(ids_b[j]), float(sim_chunk[i][j]))
                    for j in top_indices
                    if sim_chunk[i][j] > 0.01
                ]
                if candidates:
                    existing = all_candidates.get(item_id_a, [])
                    existing.extend(candidates)
                    all_candidates[item_id_a] = existing

    logger.info("TF-IDF candidates: %d A items with candidates", len(all_candidates))
    return all_candidates


# ---------------------------------------------------------------------------
# OpenAI embedding candidate generation
# ---------------------------------------------------------------------------


async def _embed_batch(
    client: httpx.AsyncClient,
    texts: list[str],
    config: OpenAIConfig,
    pipeline_config: PipelineConfig,
) -> list[list[float]]:
    """Embed a batch of texts via the OpenAI embeddings API with retry logic."""

    async def _call() -> list[list[float]]:
        resp = await client.post(
            f"{config.endpoint}embeddings",
            headers={
                "api-key": config.api_key,
                "Content-Type": "application/json",
            },
            json={
                "model": config.embedding_model,
                "input": texts,
            },
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()["data"]
        # Sort by index to ensure order matches input
        data.sort(key=lambda x: x["index"])
        return [d["embedding"] for d in data]

    return await retry_async(
        _call,
        max_retries=pipeline_config.max_retries,
        base_delay=pipeline_config.retry_base_delay,
    )


def _embedding_cache_path(label: str) -> Path:
    """Return the checkpoint file path for cached embeddings."""
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    return CHECKPOINT_DIR / f"embeddings_{label}.npy"


def _ids_cache_path(label: str) -> Path:
    """Return the checkpoint file path for cached item IDs."""
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    return CHECKPOINT_DIR / f"embedding_ids_{label}.npy"


async def compute_embeddings(
    df: pd.DataFrame,
    label: str,
    oai_config: OpenAIConfig,
    pipeline_config: PipelineConfig,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Compute embeddings for all products in a DataFrame via OpenAI API.

    Embeddings are cached to disk (.npy files) so re-runs skip this step.

    Args:
        df: DataFrame with name_norm, brand, category columns.
        label: Cache label (e.g., "store_a" or "store_b").
        oai_config: OpenAI API credentials.
        pipeline_config: Pipeline parameters.

    Returns:
        (embeddings, item_ids) where embeddings is (N, 1536) float32 array
        and item_ids is (N,) int64 array.
    """
    cache_path = _embedding_cache_path(label)
    ids_path = _ids_cache_path(label)

    if cache_path.exists() and ids_path.exists():
        logger.info("Loading cached embeddings for %s from %s", label, cache_path)
        embeddings = np.load(cache_path)
        item_ids = np.load(ids_path)
        return embeddings, item_ids

    texts = build_composite_text(df).tolist()
    item_ids = df["item_id"].values.astype(np.int64)
    batch_size = pipeline_config.embedding_batch_size
    semaphore = asyncio.Semaphore(pipeline_config.embedding_concurrency)

    all_embeddings: list[list[float]] = [[] for _ in range(len(texts))]

    async with httpx.AsyncClient() as client:

        async def process_batch(start: int) -> None:
            async with semaphore:
                end = min(start + batch_size, len(texts))
                batch_texts = texts[start:end]
                # Ensure no empty strings (API rejects them)
                batch_texts = [t if t.strip() else "unknown product" for t in batch_texts]
                result = await _embed_batch(client, batch_texts, oai_config, pipeline_config)
                for i, emb in enumerate(result):
                    all_embeddings[start + i] = emb

        tasks = [
            process_batch(i)
            for i in range(0, len(texts), batch_size)
        ]

        logger.info(
            "Computing embeddings for %s: %d products in %d batches (concurrency=%d)",
            label, len(texts), len(tasks), pipeline_config.embedding_concurrency,
        )

        # Process with progress bar
        for coro in tqdm(
            asyncio.as_completed(tasks),
            total=len(tasks),
            desc=f"Embedding {label}",
        ):
            await coro

    embeddings = np.array(all_embeddings, dtype=np.float32)

    # Cache to disk
    np.save(cache_path, embeddings)
    np.save(ids_path, item_ids)
    logger.info("Cached embeddings for %s: shape %s", label, embeddings.shape)

    return embeddings, item_ids


def generate_embedding_candidates(
    blocks: dict[str, tuple[pd.DataFrame, pd.DataFrame]],
    embeddings_a: np.ndarray,
    ids_a: np.ndarray,
    embeddings_b: np.ndarray,
    ids_b: np.ndarray,
    config: PipelineConfig,
) -> dict[int, list[tuple[int, float]]]:
    """
    Generate top-K candidates using precomputed embedding cosine similarity.

    Uses the same category blocks as TF-IDF but compares embedding vectors
    instead of TF-IDF vectors.

    Args:
        blocks: Category blocks from blocking module.
        embeddings_a/ids_a: Store A embeddings and item IDs.
        embeddings_b/ids_b: Store B embeddings and item IDs.
        config: Pipeline configuration.

    Returns:
        Dict mapping item_id_A → list of (item_id_B, embedding_score).
    """
    logger.info("Generating embedding candidates...")

    # Build ID → index lookup for fast slicing
    id_to_idx_a = {int(id_): i for i, id_ in enumerate(ids_a)}
    id_to_idx_b = {int(id_): i for i, id_ in enumerate(ids_b)}

    all_candidates: dict[int, list[tuple[int, float]]] = {}

    for block_name, (a_block, b_block) in tqdm(blocks.items(), desc="Embedding blocks"):
        if a_block.empty or b_block.empty:
            continue

        # Get indices for this block
        a_indices = [id_to_idx_a[int(id_)] for id_ in a_block["item_id"].values if int(id_) in id_to_idx_a]
        b_indices = [id_to_idx_b[int(id_)] for id_ in b_block["item_id"].values if int(id_) in id_to_idx_b]

        if not a_indices or not b_indices:
            continue

        block_emb_a = embeddings_a[a_indices]
        block_emb_b = embeddings_b[b_indices]
        block_ids_a = ids_a[a_indices]
        block_ids_b = ids_b[b_indices]

        # Normalize for cosine similarity
        norms_a = np.linalg.norm(block_emb_a, axis=1, keepdims=True)
        norms_b = np.linalg.norm(block_emb_b, axis=1, keepdims=True)
        norms_a[norms_a == 0] = 1
        norms_b[norms_b == 0] = 1
        normed_a = block_emb_a / norms_a
        normed_b = block_emb_b / norms_b

        # Chunked cosine similarity
        chunk_size = config.tfidf_chunk_size
        for start in range(0, len(block_ids_a), chunk_size):
            end = min(start + chunk_size, len(block_ids_a))
            sim_chunk = normed_a[start:end] @ normed_b.T

            for i in range(sim_chunk.shape[0]):
                item_id_a = int(block_ids_a[start + i])

                top_k = min(config.embedding_top_k, sim_chunk.shape[1])
                top_indices = np.argpartition(sim_chunk[i], -top_k)[-top_k:]
                top_indices = top_indices[np.argsort(sim_chunk[i][top_indices])[::-1]]

                candidates = [
                    (int(block_ids_b[j]), float(sim_chunk[i][j]))
                    for j in top_indices
                    if sim_chunk[i][j] > 0.01
                ]
                if candidates:
                    existing = all_candidates.get(item_id_a, [])
                    existing.extend(candidates)
                    all_candidates[item_id_a] = existing

    logger.info("Embedding candidates: %d A items with candidates", len(all_candidates))
    return all_candidates


# ---------------------------------------------------------------------------
# Merge candidates from both methods
# ---------------------------------------------------------------------------


def merge_candidates(
    tfidf_candidates: dict[int, list[tuple[int, float]]],
    embedding_candidates: dict[int, list[tuple[int, float]]],
) -> dict[int, dict[int, dict[str, float]]]:
    """
    Merge TF-IDF and embedding candidates into a unified candidate set.

    For each A item, unions the B candidates from both methods and stores
    both scores (tfidf_score, embedding_score) where available.

    Returns:
        Dict mapping item_id_A → {item_id_B: {"tfidf": score, "embedding": score}}.
    """
    merged: dict[int, dict[int, dict[str, float]]] = {}

    # Add TF-IDF candidates
    for id_a, candidates in tfidf_candidates.items():
        if id_a not in merged:
            merged[id_a] = {}
        for id_b, score in candidates:
            if id_b not in merged[id_a]:
                merged[id_a][id_b] = {"tfidf": 0.0, "embedding": 0.0}
            merged[id_a][id_b]["tfidf"] = max(merged[id_a][id_b]["tfidf"], score)

    # Add embedding candidates
    for id_a, candidates in embedding_candidates.items():
        if id_a not in merged:
            merged[id_a] = {}
        for id_b, score in candidates:
            if id_b not in merged[id_a]:
                merged[id_a][id_b] = {"tfidf": 0.0, "embedding": 0.0}
            merged[id_a][id_b]["embedding"] = max(merged[id_a][id_b]["embedding"], score)

    total_candidates = sum(len(cands) for cands in merged.values())
    logger.info(
        "Merged candidates: %d A items, %d total candidate pairs",
        len(merged), total_candidates,
    )
    return merged
