"""
Data loading and preprocessing for the product matching pipeline.

Handles:
- CSV loading with JSON field parsing (item_info, sizing_comp)
- Product name normalization (lowercase, strip symbols, collapse whitespace)
- Brand extraction from product names when brand_raw is missing
- Size extraction from product names when size_user_friendly is missing
- Filtering Store A to matchable categories only
"""

from __future__ import annotations

import re
from typing import Any

import pandas as pd

from src.config import (
    MATCHABLE_CATEGORIES_A,
    STORE_A_PATH,
    STORE_B_PATH,
    WALMART_PRIVATE_LABELS,
    WEGMANS_PRIVATE_LABELS,
)
from src.utils import logger, parse_size, safe_parse_json

# ---------------------------------------------------------------------------
# Name normalization
# ---------------------------------------------------------------------------

_MULTIPACK_RE = re.compile(r"^\(\d+\s*pack\)\s*", re.IGNORECASE)
_TRADEMARK_RE = re.compile(r"[®™©]")
_NONALNUM_RE = re.compile(r"[^\w\s]")
_WHITESPACE_RE = re.compile(r"\s+")


def normalize_name(name: str) -> str:
    """
    Normalize a product name for matching.

    Lowercases, strips trademark symbols, removes multipack prefixes,
    replaces dashes with spaces, removes non-alphanumeric characters,
    and collapses whitespace.
    """
    if not isinstance(name, str):
        return ""
    text = name.lower()
    text = _MULTIPACK_RE.sub("", text)
    text = _TRADEMARK_RE.sub("", text)
    text = text.replace("–", " ").replace("—", " ").replace("-", " ")
    text = _NONALNUM_RE.sub(" ", text)
    text = _WHITESPACE_RE.sub(" ", text).strip()
    return text


# ---------------------------------------------------------------------------
# Brand extraction from product name
# ---------------------------------------------------------------------------


def build_brand_dictionary(store_b: pd.DataFrame) -> set[str]:
    """
    Build a set of known brand names from Store B's brand_raw field
    combined with known Walmart private labels.

    Brands are lowercased and deduplicated.
    """
    b_brands = set(
        store_b["brand_raw"]
        .dropna()
        .str.strip()
        .str.lower()
        .unique()
    )
    all_brands = b_brands | WALMART_PRIVATE_LABELS | WEGMANS_PRIVATE_LABELS
    # Remove empty strings
    all_brands.discard("")
    return all_brands


def extract_brand_from_name(
    name_normalized: str,
    brand_dict: set[str],
) -> str | None:
    """
    Attempt to extract a brand from the beginning of a normalized product name.

    Tries matching the first 1, 2, 3, and 4 words against the brand dictionary.
    Returns the longest match (most specific brand).
    """
    words = name_normalized.split()
    best_match: str | None = None
    for n_words in range(1, min(5, len(words) + 1)):
        candidate = " ".join(words[:n_words])
        if candidate in brand_dict:
            best_match = candidate
    return best_match


# ---------------------------------------------------------------------------
# JSON field extraction
# ---------------------------------------------------------------------------


def extract_categories(item_info: Any) -> dict[str, str | None]:
    """Extract category_0..3 from item_info JSON string."""
    parsed = safe_parse_json(item_info)
    return {
        f"category_{i}": parsed.get(f"category_{i}")
        for i in range(4)
    }


def extract_size_from_sizing_comp(sizing_comp: Any) -> str | None:
    """Extract size_user_friendly from sizing_comp JSON string."""
    parsed = safe_parse_json(sizing_comp)
    return parsed.get("size_user_friendly")


# ---------------------------------------------------------------------------
# Main data loading
# ---------------------------------------------------------------------------


def load_and_preprocess() -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Load both store datasets and apply all preprocessing steps.

    Returns (store_a, store_b) DataFrames with added columns:
    - name_norm: normalized product name
    - brand: resolved brand (from brand_raw or extracted from name)
    - size_str: size string (from sizing_comp or extracted from name)
    - size_parsed: (value, unit) tuple or None
    - category_0..3: parsed category hierarchy
    - is_private_label_brand: whether the brand is a private label
    """
    logger.info("Loading Store A from %s", STORE_A_PATH)
    store_a = pd.read_csv(STORE_A_PATH, low_memory=False)
    logger.info("Loaded Store A: %d products", len(store_a))

    logger.info("Loading Store B from %s", STORE_B_PATH)
    store_b = pd.read_csv(STORE_B_PATH, low_memory=False)
    logger.info("Loaded Store B: %d products", len(store_b))

    # Drop rows with non-numeric item_id (malformed data)
    for label in ("A", "B"):
        df = store_a if label == "A" else store_b
        valid = pd.to_numeric(df["item_id"], errors="coerce").notna()
        n_bad = (~valid).sum()
        if n_bad > 0:
            logger.warning("Dropping %d rows with non-numeric item_id from Store %s", n_bad, label)
            df = df[valid].copy()
            df["item_id"] = df["item_id"].astype(int)
            if label == "A":
                store_a = df
            else:
                store_b = df

    # Build brand dictionary from Store B
    brand_dict = build_brand_dictionary(store_b)
    logger.info("Brand dictionary: %d known brands", len(brand_dict))

    # Process both stores
    for label, df in [("A", store_a), ("B", store_b)]:
        logger.info("Preprocessing Store %s...", label)

        # Normalize names
        df["name_norm"] = df["name"].apply(normalize_name)

        # Parse categories from item_info
        cat_df = df["item_info"].apply(extract_categories).apply(pd.Series)
        for col in cat_df.columns:
            df[col] = cat_df[col]

        # Extract size from sizing_comp
        df["size_str"] = df["sizing_comp"].apply(extract_size_from_sizing_comp)

        # For items missing size_str, try extracting from name
        missing_size = df["size_str"].isna()
        df.loc[missing_size, "size_str"] = df.loc[missing_size, "name"].apply(
            lambda n: _extract_size_string_from_name(n) if isinstance(n, str) else None
        )

        # Parse size into (value, unit) tuples
        df["size_parsed"] = df["size_str"].apply(parse_size)

        # Resolve brand
        df["brand"] = df["brand_raw"].str.strip().str.lower()
        missing_brand = df["brand"].isna() | (df["brand"] == "")
        df.loc[missing_brand, "brand"] = df.loc[missing_brand, "name_norm"].apply(
            lambda n: extract_brand_from_name(n, brand_dict)
        )

        # Flag private labels
        all_private = WALMART_PRIVATE_LABELS | WEGMANS_PRIVATE_LABELS
        df["is_private_label_brand"] = df["brand"].apply(
            lambda b: b in all_private if isinstance(b, str) else False
        )

        logger.info(
            "  Store %s — brand filled: %d/%d (%.1f%%), size filled: %d/%d (%.1f%%)",
            label,
            df["brand"].notna().sum(), len(df),
            df["brand"].notna().mean() * 100,
            df["size_parsed"].notna().sum(), len(df),
            df["size_parsed"].apply(lambda x: x is not None).mean() * 100,
        )

    # Filter Store A to matchable categories
    original_count = len(store_a)
    matchable = store_a["category_0"].isin(MATCHABLE_CATEGORIES_A)
    # Also keep items with unknown categories (they might be matchable)
    unknown = store_a["category_0"].isna()
    store_a = store_a[matchable | unknown].reset_index(drop=True)
    logger.info(
        "Filtered Store A: %d → %d products (removed %d non-matchable)",
        original_count, len(store_a), original_count - len(store_a),
    )

    return store_a, store_b


def _extract_size_string_from_name(name: str) -> str | None:
    """Pull a size substring from a product name (e.g., '32 oz' from 'Heinz Ketchup 32 oz')."""
    m = re.search(
        r"(\d+\.?\d*\s*(?:fl\.?\s*oz\.?|ounces?|oz\.?"
        r"|lbs?\.?|pounds?"
        r"|ct|count|pk|pack"
        r"|grams?|kg"
        r"|ml|liters?|litres?"
        r"|gal\.?|gallons?"
        r"|quarts?|qt|pints?|pt))",
        name,
        re.IGNORECASE,
    )
    return m.group(1).strip() if m else None
