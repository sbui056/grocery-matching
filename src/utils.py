"""
Shared utilities: logging setup, async retry logic, and size normalization.
"""

from __future__ import annotations

import asyncio
import json
import logging
import random
import re
import sys
from typing import Any, Callable, TypeVar

T = TypeVar("T")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------


def setup_logging(level: int = logging.INFO) -> logging.Logger:
    """Configure and return the pipeline logger with timestamped output."""
    logger = logging.getLogger("matcher")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s [%(levelname)s] %(message)s",
                datefmt="%H:%M:%S",
            )
        )
        logger.addHandler(handler)
    logger.setLevel(level)
    return logger


logger = setup_logging()

# ---------------------------------------------------------------------------
# Retry with exponential backoff
# ---------------------------------------------------------------------------


async def retry_async(
    fn: Callable[..., Any],
    *args: Any,
    max_retries: int = 5,
    base_delay: float = 1.0,
    **kwargs: Any,
) -> Any:
    """
    Call an async function with exponential backoff on failure.

    Retries on any exception, doubling the delay each attempt with
    random jitter to avoid thundering-herd problems.
    """
    for attempt in range(max_retries):
        try:
            return await fn(*args, **kwargs)
        except Exception as exc:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2**attempt) + random.uniform(0, 1)
            logger.warning(
                "Retry %d/%d after error: %s — waiting %.1fs",
                attempt + 1,
                max_retries,
                str(exc)[:120],
                delay,
            )
            await asyncio.sleep(delay)

# ---------------------------------------------------------------------------
# JSON field parsing
# ---------------------------------------------------------------------------


def safe_parse_json(value: Any) -> dict[str, Any]:
    """Parse a JSON string, handling Python-style None/True/False."""
    if not isinstance(value, str) or not value.strip():
        return {}
    try:
        cleaned = value.replace("None", "null").replace("True", "true").replace("False", "false")
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError):
        return {}


# ---------------------------------------------------------------------------
# Size normalization
# ---------------------------------------------------------------------------

# Canonical unit mapping — maps all known variants to a standard key
_UNIT_ALIASES: dict[str, str] = {
    "fl oz": "fl_oz", "fl. oz": "fl_oz", "fl. oz.": "fl_oz",
    "fluid ounce": "fl_oz", "fluid ounces": "fl_oz",
    "oz": "oz", "oz.": "oz", "ounce": "oz", "ounces": "oz",
    "lb": "lb", "lb.": "lb", "lbs": "lb", "lbs.": "lb",
    "pound": "lb", "pounds": "lb",
    "ct": "ct", "count": "ct",
    "pk": "ct", "pack": "ct",
    "g": "g", "gram": "g", "grams": "g",
    "kg": "kg", "kilogram": "kg",
    "ml": "ml", "milliliter": "ml",
    "l": "l", "liter": "l", "litre": "l",
    "gal": "gal", "gal.": "gal", "gallon": "gal", "gallons": "gal",
    "qt": "qt", "quart": "qt", "quarts": "qt",
    "pt": "pt", "pint": "pt", "pints": "pt",
    "each": "each", "ea": "each",
}

# Conversion factors to a common base (oz for weight, fl_oz for volume)
_WEIGHT_TO_OZ: dict[str, float] = {
    "oz": 1.0, "lb": 16.0, "g": 0.03527396, "kg": 35.27396,
}
_VOLUME_TO_FLOZ: dict[str, float] = {
    "fl_oz": 1.0, "ml": 0.03381402, "l": 33.81402,
    "gal": 128.0, "qt": 32.0, "pt": 16.0,
}

# Regex to pull a numeric value + unit from a string
_SIZE_PATTERN = re.compile(
    r"(\d+\.?\d*)\s*(fl\.?\s*oz\.?|fluid\s+ounces?|ounces?|oz\.?"
    r"|lbs?\.?|pounds?"
    r"|ct|count|pk|pack"
    r"|grams?|kg|kilogram"
    r"|ml|milliliter|liters?|litres?|l"
    r"|gal\.?|gallons?"
    r"|quarts?|qt"
    r"|pints?|pt"
    r"|each|ea)",
    re.IGNORECASE,
)


def parse_size(text: str | None) -> tuple[float, str] | None:
    """
    Extract (value, canonical_unit) from a size string.

    Returns None if no recognizable size pattern is found.
    """
    if not text:
        return None
    m = _SIZE_PATTERN.search(text)
    if not m:
        return None
    value = float(m.group(1))
    raw_unit = m.group(2).strip().rstrip(".").lower()
    # Normalize multi-word units
    raw_unit = re.sub(r"\s+", " ", raw_unit)
    canon = _UNIT_ALIASES.get(raw_unit)
    if canon is None:
        return None
    return (value, canon)


def sizes_match(a: tuple[float, str] | None, b: tuple[float, str] | None) -> float:
    """
    Score how well two parsed sizes match.

    Returns:
        1.0  — identical unit and value
        0.9  — convertible units, values match after conversion
        0.8  — same unit, values within 10%
        0.3  — one or both sizes unknown (neutral)
        0.0  — same or convertible units but values differ by >25%
    """
    if a is None or b is None:
        return 0.3

    val_a, unit_a = a
    val_b, unit_b = b

    if unit_a == unit_b:
        if val_a == val_b:
            return 1.0
        ratio = min(val_a, val_b) / max(val_a, val_b) if max(val_a, val_b) > 0 else 0
        if ratio >= 0.9:
            return 0.8
        return 0.0

    # Try unit conversion (weight)
    if unit_a in _WEIGHT_TO_OZ and unit_b in _WEIGHT_TO_OZ:
        oz_a = val_a * _WEIGHT_TO_OZ[unit_a]
        oz_b = val_b * _WEIGHT_TO_OZ[unit_b]
        ratio = min(oz_a, oz_b) / max(oz_a, oz_b) if max(oz_a, oz_b) > 0 else 0
        if ratio >= 0.9:
            return 0.9
        return 0.0

    # Try unit conversion (volume)
    if unit_a in _VOLUME_TO_FLOZ and unit_b in _VOLUME_TO_FLOZ:
        fl_a = val_a * _VOLUME_TO_FLOZ[unit_a]
        fl_b = val_b * _VOLUME_TO_FLOZ[unit_b]
        ratio = min(fl_a, fl_b) / max(fl_a, fl_b) if max(fl_a, fl_b) > 0 else 0
        if ratio >= 0.9:
            return 0.9
        return 0.0

    # Incompatible unit types (e.g., oz vs ct)
    return 0.0
