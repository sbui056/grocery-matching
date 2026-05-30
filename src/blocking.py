"""
Category-based blocking to reduce the product matching search space.

Maps Store A categories (Walmart) to compatible Store B categories (Wegmans)
so that products are only compared within plausible category pairings. This
reduces the comparison space from ~9.4 billion pairs to ~1-2 billion.
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from src.utils import logger

# ---------------------------------------------------------------------------
# Category mapping: Store A (category_0, category_1) → Store B category_0 set
# ---------------------------------------------------------------------------

# Store A category_1 values under "Food" that map to specific B categories
_FOOD_SUBCATEGORY_MAP: dict[str, set[str]] = {
    "Frozen Foods": {"Frozen"},
    "Dairy & Eggs": {"Dairy", "Cheese"},
    "Meat & Seafood": {"Meat", "Seafood"},
    "Fresh Produce": {"Produce & Floral"},
    "Bakery & Bread": {"Bakery"},
    "Shop All Bread and Bakery": {"Bakery"},
    "Holiday baked goods": {"Bakery"},
    "Alcohol": {"Wine, Beer & Spirits"},
}

# Food subcategories that map broadly to Grocery
_FOOD_BROAD_SUBS: set[str] = {
    "Pantry", "Snacks, Cookies & Chips", "Beverages", "Candy",
    "Baking", "International Food", "Breakfast & Cereal", "Coffee",
    "Deli", "From Our Brands", "Dietary & Lifestyle Shop",
    "Seasonal Grocery",
}

# Non-food Store A categories that map to "More Departments" in Store B
_MORE_DEPARTMENTS_CATS: set[str] = {
    "Health and Medicine",
    "Household Essentials",
    "Personal Care",
    "Beauty",
    "Baby",
}

# ---------------------------------------------------------------------------
# Block assignment
# ---------------------------------------------------------------------------


def assign_blocks(
    store_a: pd.DataFrame,
    store_b: pd.DataFrame,
) -> dict[str, tuple[pd.DataFrame, pd.DataFrame]]:
    """
    Partition products into category blocks for candidate generation.

    Each block contains a subset of Store A products and their compatible
    Store B products. Products are compared only within the same block.

    Returns a dict mapping block_name → (a_subset, b_subset).
    """
    blocks: dict[str, tuple[pd.DataFrame, pd.DataFrame]] = {}

    # --- Food subcategory blocks ---
    a_food = store_a[store_a["category_0"] == "Food"]

    for sub, b_cats in _FOOD_SUBCATEGORY_MAP.items():
        a_sub = a_food[a_food["category_1"] == sub]
        if a_sub.empty:
            continue
        b_sub = store_b[store_b["category_0"].isin(b_cats)]
        if b_sub.empty:
            continue
        block_name = f"food_{sub.lower().replace(' & ', '_').replace(' ', '_')}"
        blocks[block_name] = (a_sub, b_sub)

    # Food broad: all remaining Food subcategories → Grocery + Prepared Foods + Cheese
    assigned_food_subs = set(_FOOD_SUBCATEGORY_MAP.keys())
    a_food_broad = a_food[
        ~a_food["category_1"].isin(assigned_food_subs)
        | a_food["category_1"].isna()
    ]
    if not a_food_broad.empty:
        b_grocery_broad = store_b[
            store_b["category_0"].isin({"Grocery", "Prepared Foods", "Cheese"})
        ]
        if not b_grocery_broad.empty:
            blocks["food_grocery_broad"] = (a_food_broad, b_grocery_broad)

    # --- Non-food category blocks ---
    # Health, Household, Personal Care, Beauty, Baby → More Departments
    a_non_food = store_a[store_a["category_0"].isin(_MORE_DEPARTMENTS_CATS)]
    if not a_non_food.empty:
        b_more = store_b[store_b["category_0"] == "More Departments"]
        if not b_more.empty:
            blocks["non_food_more_departments"] = (a_non_food, b_more)

    # Pets → Grocery (Wegmans has pet food under Grocery)
    a_pets = store_a[store_a["category_0"] == "Pets"]
    if not a_pets.empty:
        b_all = store_b  # Pets may appear in Grocery or More Departments
        blocks["pets"] = (a_pets, b_all)

    # Unknown/missing category → all of Store B (higher threshold applied later)
    a_unknown = store_a[store_a["category_0"].isna()]
    if not a_unknown.empty:
        blocks["unknown_category"] = (a_unknown, store_b)

    # Log block sizes
    total_a = sum(len(a) for a, _ in blocks.values())
    total_pairs = sum(len(a) * len(b) for a, b in blocks.values())
    logger.info("Created %d category blocks:", len(blocks))
    for name, (a_sub, b_sub) in sorted(blocks.items()):
        logger.info(
            "  %-35s A=%6d  B=%6d  pairs=%12s",
            name, len(a_sub), len(b_sub), f"{len(a_sub) * len(b_sub):,}",
        )
    logger.info("Total A products in blocks: %d", total_a)
    logger.info("Total candidate pairs: %s", f"{total_pairs:,}")

    return blocks
