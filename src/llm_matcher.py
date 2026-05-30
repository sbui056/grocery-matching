"""
LLM-based match adjudication using Azure OpenAI gpt-5.4-nano.

Sends batches of product candidates to the LLM for final match decisions.
Uses JSON mode for structured output, async concurrency for throughput,
and checkpoint/resume for fault tolerance.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

import httpx
import pandas as pd
from tqdm import tqdm

from src.config import CHECKPOINT_DIR, OpenAIConfig, PipelineConfig
from src.utils import logger, retry_async

# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a grocery product matching expert. Your job is to determine \
if products from Store A (Walmart) match candidates from Store B (Wegmans).

A match means a customer would consider them essentially the same product. Rules:
- Same brand + same product + same size = MATCH (exact match)
- Different private-label brands (e.g., Great Value vs Wegmans) + same product + same size = MATCH (non-exact match)
- Different sizes of the same product = NO MATCH
- Different flavors or variants of the same product line = NO MATCH
- If uncertain whether products are truly the same, choose 0 (no match)

Always respond with a JSON object: {"matches": [{"id": <product_number>, "match": <candidate_number_or_0>, "confidence": "<high|medium|low>"}]}"""


def _format_product_batch(
    batch: list[dict[str, Any]],
    store_a: pd.DataFrame,
    config: PipelineConfig,
) -> str:
    """
    Format a batch of products and their candidates into a prompt string.

    Each product in the batch gets its top-N candidates listed with
    name, brand, and size information.
    """
    a_data = store_a.set_index("item_id")[["name", "brand", "size_str"]].to_dict("index")
    lines: list[str] = []

    for i, item in enumerate(batch, 1):
        id_a = item["item_id_a"]
        a_info = a_data.get(id_a, {})
        lines.append(
            f"[A{i}]: {a_info.get('name', 'Unknown')}"
            f" | Brand: {a_info.get('brand', 'unknown')}"
            f" | Size: {a_info.get('size_str', 'unknown')}"
        )

        candidates = item["candidates"][:config.llm_candidates_per_product]
        for j, cand in enumerate(candidates, 1):
            lines.append(
                f"  {j}: {cand.get('name_b', 'Unknown')}"
                f" | Brand: {cand.get('brand_b', 'unknown')}"
                f" | Size: {cand.get('size_b', 'unknown')}"
            )
        lines.append("")

    lines.append(
        "For each product A1..A{}, respond with: "
        '{"matches": [{"id": N, "match": <1|2|3|0>, "confidence": "<high|medium|low>"}, ...]}'.replace(
            "{}", str(len(batch))
        )
    )
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Checkpoint management
# ---------------------------------------------------------------------------


def _checkpoint_path() -> Path:
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    return CHECKPOINT_DIR / "llm_results.jsonl"


def load_checkpoint() -> dict[int, dict[str, Any]]:
    """Load previously completed LLM results from checkpoint file."""
    path = _checkpoint_path()
    results: dict[int, dict[str, Any]] = {}
    if path.exists():
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                    results[record["item_id_a"]] = record
                except (json.JSONDecodeError, KeyError):
                    continue
    return results


def _append_checkpoint(records: list[dict[str, Any]]) -> None:
    """Append completed results to the checkpoint file."""
    path = _checkpoint_path()
    with open(path, "a") as f:
        for record in records:
            f.write(json.dumps(record) + "\n")


# ---------------------------------------------------------------------------
# LLM API call
# ---------------------------------------------------------------------------


async def _call_llm(
    client: httpx.AsyncClient,
    prompt: str,
    oai_config: OpenAIConfig,
    pipeline_config: PipelineConfig,
) -> dict[str, Any]:
    """Make a single LLM API call with retry logic."""

    async def _call() -> dict[str, Any]:
        resp = await client.post(
            f"{oai_config.endpoint}chat/completions",
            headers={
                "api-key": oai_config.api_key,
                "Content-Type": "application/json",
            },
            json={
                "model": oai_config.deployment_name,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "max_completion_tokens": 200,
                "temperature": pipeline_config.llm_temperature,
                "response_format": {"type": "json_object"},
            },
            timeout=60.0,
        )
        resp.raise_for_status()
        return resp.json()

    return await retry_async(
        _call,
        max_retries=pipeline_config.max_retries,
        base_delay=pipeline_config.retry_base_delay,
    )


def _parse_llm_response(
    response: dict[str, Any],
    batch: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Parse LLM JSON response into per-product match results."""
    try:
        content = response["choices"][0]["message"]["content"]
        parsed = json.loads(content)

        matches_list = parsed.get("matches", [])
        if not isinstance(matches_list, list):
            # Handle single-object response
            if isinstance(parsed, dict) and "id" in parsed:
                matches_list = [parsed]
            else:
                matches_list = []

    except (json.JSONDecodeError, KeyError, IndexError):
        logger.warning("Failed to parse LLM response, treating batch as no-match")
        matches_list = []

    # Build results keyed by batch index
    result_by_id: dict[int, dict[str, Any]] = {}
    for m in matches_list:
        idx = m.get("id", 0)
        result_by_id[idx] = {
            "match": m.get("match", 0),
            "confidence": m.get("confidence", "low"),
        }

    results: list[dict[str, Any]] = []
    for i, item in enumerate(batch, 1):
        llm_result = result_by_id.get(i, {"match": 0, "confidence": "low"})
        match_idx = llm_result["match"]

        # Resolve match_idx to item_id_b
        item_id_b = None
        if isinstance(match_idx, int) and 1 <= match_idx <= len(item["candidates"]):
            item_id_b = item["candidates"][match_idx - 1]["item_id_b"]

        results.append({
            "item_id_a": item["item_id_a"],
            "item_id_b_llm": item_id_b,
            "llm_match_idx": match_idx,
            "llm_confidence": llm_result["confidence"],
        })

    return results


# ---------------------------------------------------------------------------
# Main LLM adjudication
# ---------------------------------------------------------------------------


async def run_llm_adjudication(
    scored: dict[int, list[dict[str, Any]]],
    store_a: pd.DataFrame,
    oai_config: OpenAIConfig,
    pipeline_config: PipelineConfig,
) -> dict[int, dict[str, Any]]:
    """
    Run LLM adjudication on all scored candidates.

    Batches products into groups, sends each batch to gpt-5.4-nano for
    match decisions, and returns per-product results with checkpoint/resume.

    Args:
        scored: From scoring.score_candidates().
        store_a: Preprocessed Store A DataFrame.
        oai_config: OpenAI API credentials.
        pipeline_config: Pipeline configuration.

    Returns:
        Dict mapping item_id_A → {item_id_b_llm, llm_match_idx, llm_confidence}.
    """
    # Filter to items that have viable candidates
    min_threshold = pipeline_config.exclude_threshold
    items_to_judge: list[dict[str, Any]] = []
    for id_a, cands in scored.items():
        if not cands or cands[0]["composite"] < min_threshold:
            continue
        items_to_judge.append({
            "item_id_a": id_a,
            "candidates": cands[:pipeline_config.llm_candidates_per_product],
        })

    logger.info("LLM adjudication: %d items to judge", len(items_to_judge))

    # Load checkpoint
    checkpoint = load_checkpoint()
    already_done = set(checkpoint.keys())
    remaining = [item for item in items_to_judge if item["item_id_a"] not in already_done]
    logger.info(
        "Checkpoint: %d already done, %d remaining",
        len(already_done), len(remaining),
    )

    if not remaining:
        logger.info("All items already adjudicated, skipping LLM calls")
        return checkpoint

    # Build batches
    batch_size = pipeline_config.llm_products_per_call
    batches: list[list[dict[str, Any]]] = []
    for i in range(0, len(remaining), batch_size):
        batches.append(remaining[i : i + batch_size])

    logger.info(
        "Processing %d batches (%d products/batch, concurrency=%d)",
        len(batches), batch_size, pipeline_config.llm_concurrency,
    )

    semaphore = asyncio.Semaphore(pipeline_config.llm_concurrency)
    progress = tqdm(total=len(batches), desc="LLM batches")

    all_results: dict[int, dict[str, Any]] = dict(checkpoint)

    async with httpx.AsyncClient() as client:

        async def process_batch(batch: list[dict[str, Any]]) -> None:
            async with semaphore:
                prompt = _format_product_batch(batch, store_a, pipeline_config)
                response = await _call_llm(client, prompt, oai_config, pipeline_config)
                results = _parse_llm_response(response, batch)

                # Save to checkpoint
                _append_checkpoint(results)

                for r in results:
                    all_results[r["item_id_a"]] = r

                progress.update(1)

        tasks = [process_batch(batch) for batch in batches]
        await asyncio.gather(*tasks)

    progress.close()
    logger.info("LLM adjudication complete: %d total results", len(all_results))

    # Summarize results
    n_match = sum(1 for r in all_results.values() if r.get("item_id_b_llm") is not None)
    n_no_match = len(all_results) - n_match
    confidence_counts: dict[str, int] = {}
    for r in all_results.values():
        conf = r.get("llm_confidence", "unknown")
        confidence_counts[conf] = confidence_counts.get(conf, 0) + 1

    logger.info("  Matched: %d, No match: %d", n_match, n_no_match)
    logger.info("  Confidence: %s", confidence_counts)

    return all_results
