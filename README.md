# egreader-Common-sentences

This repository stores cleaned high-frequency daily English sentence data for egreader, with Simplified Chinese translations.

## Files

- `en_top_sentences.csv`: original source frequency table.
- `data/common_sentences_zh.tsv`: cleaned sentence data with Chinese translations.
- `index.js`: CommonJS helper that loads the cleaned TSV and exposes query APIs for egreader.
- `scripts/validate_common_sentences.py`: validation script for data quality checks.

## Current cleaned dataset

The current checked-in dataset contains the top 150 high-frequency daily spoken expressions selected from `en_top_sentences.csv`.

Each row contains:

```text
id	en	zh	category	categoryZh	wordCount	frequency
```

Categories:

- `question` / `疑问句`
- `greeting` / `寒暄句`
- `request` / `请求句`
- `response` / `回应句`
- `emotion` / `情绪反应句`
- `fixed` / `固定口语表达`

## Cleaning rules

Kept:

- 2-8 English word sentences.
- Questions.
- Greetings and farewells.
- Requests and short commands.
- Replies and acknowledgements.
- Emotional reactions.
- Fixed spoken expressions.

Removed:

- Single-word rows, such as `Yes.`, `No.`, `What?`.
- Pure person names, such as `John.`, `Mary.`.
- Sentences over the target short-sentence range.
- Profanity and vulgar/insulting expressions.
- Broken subtitle artifacts or malformed rows.

## egreader usage

```js
const {
  commonSentences,
  searchCommonSentences,
  getSentenceById,
  getSentencesByCategory,
} = require('./index');

console.log(commonSentences[0]);
console.log(searchCommonSentences('how are you', { limit: 5 }));
console.log(getSentencesByCategory('question', 10));
console.log(getSentenceById('ecs_0001'));
```

Example item:

```json
{
  "id": "ecs_0001",
  "en": "Excuse me.",
  "zh": "打扰一下。",
  "category": "request",
  "categoryZh": "请求句",
  "wordCount": 2,
  "frequency": 374450,
  "source": "en_top_sentences.csv"
}
```

## Validation

Run:

```bash
npm run validate
```

or:

```bash
python3 scripts/validate_common_sentences.py
```
