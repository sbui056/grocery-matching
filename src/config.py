"""
Configuration constants and credential loading for the matching pipeline.

All tunable parameters — thresholds, weights, batch sizes, API settings —
are defined here so the pipeline can be adjusted without modifying logic.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "output"
CHECKPOINT_DIR = PROJECT_ROOT / "checkpoints"

STORE_A_PATH = DATA_DIR / "grocery_store_a_items_final.csv"
STORE_B_PATH = DATA_DIR / "grocery_store_b_items_final.csv"
CREDS_PATH = PROJECT_ROOT / "openai_creds.yaml"

# ---------------------------------------------------------------------------
# API credentials
# ---------------------------------------------------------------------------


@dataclass
class OpenAIConfig:
    """Azure OpenAI API configuration loaded from openai_creds.yaml."""

    endpoint: str
    api_key: str
    deployment_name: str
    embedding_model: str = "text-embedding-3-small"

    @classmethod
    def from_yaml(cls, path: Path = CREDS_PATH) -> OpenAIConfig:
        with open(path) as f:
            raw: dict[str, Any] = yaml.safe_load(f)
        oai = raw["openai"]
        return cls(
            endpoint=oai["endpoint"],
            api_key=oai["api_key"],
            deployment_name=oai["deployment_name"],
        )


# ---------------------------------------------------------------------------
# Private-label brand sets
# ---------------------------------------------------------------------------

WALMART_PRIVATE_LABELS: set[str] = {
    "great value",
    "equate",
    "freshness guaranteed",
    "marketside",
    "sam's choice",
    "bettergoods",
    "parent's choice",
    "spring valley",
    "ol' roy",
    "special kitty",
    "onn",
    "mainstays",
}

WEGMANS_PRIVATE_LABELS: set[str] = {
    "wegmans",
}

# ---------------------------------------------------------------------------
# Matchable Store A categories (top-level category_0 values)
# ---------------------------------------------------------------------------

MATCHABLE_CATEGORIES_A: set[str] = {
    "Food",
    "Health and Medicine",
    "Household Essentials",
    "Personal Care",
    "Beauty",
    "Baby",
    "Pets",
}

# ---------------------------------------------------------------------------
# Scoring weights
# ---------------------------------------------------------------------------


@dataclass
class ScoringWeights:
    """Weights for the multi-signal composite score."""

    tfidf: float = 0.25
    embedding: float = 0.25
    brand: float = 0.25
    size: float = 0.15
    jaccard: float = 0.10


# ---------------------------------------------------------------------------
# Pipeline parameters
# ---------------------------------------------------------------------------


@dataclass
class PipelineConfig:
    """All tunable pipeline parameters in one place."""

    # TF-IDF
    tfidf_max_features: int = 100_000
    tfidf_ngram_range: tuple[int, int] = (1, 2)
    tfidf_top_k: int = 20
    tfidf_chunk_size: int = 5_000

    # Embeddings
    embedding_batch_size: int = 100
    embedding_concurrency: int = 10
    embedding_top_k: int = 20

    # Scoring
    scoring_weights: ScoringWeights = field(default_factory=ScoringWeights)
    scoring_top_k: int = 5

    # LLM
    llm_products_per_call: int = 5
    llm_candidates_per_product: int = 3
    llm_concurrency: int = 30
    llm_temperature: float = 0.0

    # Thresholds
    auto_include_threshold: float = 0.60
    llm_low_confidence_threshold: float = 0.55
    exclude_threshold: float = 0.45
    unknown_category_threshold: float = 0.60

    # Retry
    max_retries: int = 5
    retry_base_delay: float = 1.0
