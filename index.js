const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, 'data', 'common_sentences_zh.tsv');

function parseTsv(text) {
  const lines = String(text || '').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const header = lines.shift().split('\t');
  return lines
    .filter(Boolean)
    .map((line) => {
      const values = line.split('\t');
      const row = Object.fromEntries(header.map((key, index) => [key, values[index] || '']));
      return {
        id: row.id,
        en: row.en,
        zh: row.zh,
        category: row.category,
        categoryZh: row.categoryZh,
        wordCount: Number(row.wordCount),
        frequency: Number(row.frequency),
        source: 'en_top_sentences.csv',
      };
    });
}

const commonSentences = parseTsv(fs.readFileSync(DATA_PATH, 'utf8'));

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchCommonSentences(query = '', options = {}) {
  const q = normalizeText(query);
  const limit = Number.isInteger(options.limit) ? options.limit : 20;
  const category = options.category || null;

  return commonSentences
    .filter((item) => {
      if (category && item.category !== category && item.categoryZh !== category) return false;
      if (!q) return true;
      return normalizeText(item.en).includes(q) || String(item.zh || '').includes(String(query));
    })
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

function getSentenceById(id) {
  return commonSentences.find((item) => item.id === id) || null;
}

function getSentencesByCategory(category, limit = 50) {
  return searchCommonSentences('', { category, limit });
}

module.exports = {
  commonSentences,
  searchCommonSentences,
  getSentenceById,
  getSentencesByCategory,
};
