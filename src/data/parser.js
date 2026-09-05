import { matchThemes } from './taxonomy.js';

/**
 * Robust RFC 4180 Compliant CSV Parser
 * Handles multiline review texts, nested escaped quotes, and empty fields.
 * @param {string} csvText - Raw CSV text content
 * @returns {Array<Object>} Array of parsed review objects
 */
export function parseCSV(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuote = false;
  let i = 0;
  const len = csvText.length;

  while (i < len) {
    const char = csvText[i];
    const nextChar = i + 1 < len ? csvText[i + 1] : '';

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        insideQuote = !insideQuote;
        i++;
        continue;
      }
    }

    if (char === ',' && !insideQuote) {
      currentRow.push(currentField);
      currentField = '';
      i++;
      continue;
    }

    if ((char === '\r' || char === '\n') && !insideQuote) {
      // Handle CRLF or LF line breaks outside quotes
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      currentField = '';
      if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  // Push trailing field/row if any
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  // Parse header
  const headers = rows[0].map(h => h.trim().toLowerCase());
  const dateIdx = headers.indexOf('date');
  const sourceIdx = headers.indexOf('source');
  const ratingIdx = headers.indexOf('rating');
  const textIdx = headers.indexOf('review_text');

  const records = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length <= Math.max(dateIdx, sourceIdx, ratingIdx, textIdx)) continue;

    const rawDate = (row[dateIdx] || '').trim();
    const rawSource = (row[sourceIdx] || 'other').trim().toLowerCase();
    const rawRating = parseInt(row[ratingIdx], 10) || 3;
    const rawText = (row[textIdx] || '').trim();

    if (!rawText) continue;

    // Normalization & Sentiment
    const normalizedText = normalizeReviewText(rawText);
    const sentiment = classifySentiment(rawRating, normalizedText);
    const themes = matchThemes(normalizedText);

    records.push({
      id: r,
      date: rawDate || new Date().toISOString(),
      source: rawSource === 'playstore' || rawSource === 'appstore' || rawSource === 'reddit' ? rawSource : 'other',
      rating: Math.max(1, Math.min(5, rawRating)),
      sentiment: sentiment,
      themes: themes,
      text: normalizedText,
      original_text: rawText
    });
  }

  return records;
}

/**
 * Text normalization: clean excessive whitespace and standardise characters
 * @param {string} text 
 * @returns {string}
 */
export function normalizeReviewText(text) {
  if (!text) return '';
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Classify sentiment based on dual star rating & text polarity keywords
 * @param {number} rating - 1 to 5
 * @param {string} text - Review text
 * @returns {"positive"|"neutral"|"negative"}
 */
export function classifySentiment(rating, text) {
  const textLower = text.toLowerCase();
  
  // Strong negative signals in text that override higher ratings
  const strongNegativeSignals = [
    'fraud', 'scam', 'cheated', 'worst', 'pathetic', 'fake product', 
    'duplicate', 'no refund', 'poor quality', 'defective', 'terrible', 'loot'
  ];
  
  // Strong positive signals
  const strongPositiveSignals = [
    'superb', 'excellent', 'amazing', 'loved it', 'fabulous', 'best app', 
    'original product', 'perfect fit', 'good quality'
  ];

  if (rating <= 2) return 'negative';
  if (rating >= 4) {
    if (strongNegativeSignals.some(sig => textLower.includes(sig))) {
      return 'negative'; // Inverted sentiment override
    }
    return 'positive';
  }

  // Rating is 3 (Neutral threshold)
  if (strongNegativeSignals.some(sig => textLower.includes(sig))) return 'negative';
  if (strongPositiveSignals.some(sig => textLower.includes(sig))) return 'positive';
  return 'neutral';
}
