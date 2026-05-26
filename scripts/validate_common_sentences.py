#!/usr/bin/env python3
"""Validate egreader common sentence TSV data."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "common_sentences_zh.tsv"
PROFANITY = re.compile(r"\b(fuck|shit|damn|bitch|bastard|asshole|bullshit|crap|goddamn|hell)\b", re.I)
VALID_CATEGORIES = {"question", "greeting", "request", "response", "emotion", "fixed"}
EXPECTED_HEADER = ["id", "en", "zh", "category", "categoryZh", "wordCount", "frequency"]


def word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z]+(?:'[A-Za-z]+)?", text))


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9']+", " ", text.lower()).strip()


def main() -> None:
    text = DATA_PATH.read_text(encoding="utf-8-sig")
    lines = [line for line in text.splitlines() if line.strip()]
    header = lines[0].split("\t")
    errors = []
    seen = set()

    if header != EXPECTED_HEADER:
        errors.append(f"bad header: {header}")

    for line_number, line in enumerate(lines[1:], start=2):
        parts = line.split("\t")
        if len(parts) != len(EXPECTED_HEADER):
            errors.append(f"line {line_number}: expected {len(EXPECTED_HEADER)} columns, got {len(parts)}")
            continue

        row = dict(zip(EXPECTED_HEADER, parts))
        english = row["en"]
        key = normalize(english)
        wc = word_count(english)

        if key in seen:
            errors.append(f"line {line_number}: duplicate sentence: {english}")
        seen.add(key)

        if wc != int(row["wordCount"]):
            errors.append(f"line {line_number}: wordCount should be {wc}, got {row['wordCount']}")
        if not 2 <= wc <= 8:
            errors.append(f"line {line_number}: word count out of range: {english}")
        if row["category"] not in VALID_CATEGORIES:
            errors.append(f"line {line_number}: bad category: {row['category']}")
        if PROFANITY.search(english):
            errors.append(f"line {line_number}: profanity detected: {english}")
        if not row["zh"].strip():
            errors.append(f"line {line_number}: missing Chinese translation")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        raise SystemExit(1)

    print(f"Validated {len(lines) - 1} common sentence records.")


if __name__ == "__main__":
    main()
