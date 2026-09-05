import { THEME_TAXONOMY, matchThemes } from '../data/taxonomy.js';

/**
 * Standard English & Domain Stopwords to filter out in BM25 calculation
 */
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 
  'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 
  'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 
  'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 
  'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 
  'it', 'its', 'itself', 'me', 'more', 'most', 'my', 'myself', 'nor', 'of', 'off', 
  'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 
  'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 
  'those', 'through', 'to', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 
  'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 
  'yours', 'yourself', 'yourselves'
]);

/**
 * High-Performance BM25 + Semantic Hybrid Retrieval Engine
 */
export class HybridRetriever {
  /**
   * @param {Array<Object>} documents - Cleaned review objects
   */
  constructor(documents = []) {
    this.documents = documents;
    this.docCount = documents.length;
    this.avgDocLength = 0;
    this.docLengths = new Uint16Array(this.docCount);
    this.invertedIndex = new Map(); // term -> Map(docIndex -> termFrequency)
    this.idf = new Map(); // term -> idfScore
    this.k1 = 1.2;
    this.b = 0.75;

    if (this.docCount > 0) {
      this.buildIndex();
    }
  }

  /**
   * Tokenize text into normalized lowercase tokens
   * @param {string} text 
   * @returns {Array<string>}
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && !STOPWORDS.has(token));
  }

  /**
   * Build inverted index and compute Inverse Document Frequencies (IDF)
   */
  buildIndex() {
    let totalLength = 0;

    for (let i = 0; i < this.docCount; i++) {
      const doc = this.documents[i];
      const tokens = this.tokenize(doc.text);
      const len = tokens.length;
      this.docLengths[i] = len;
      totalLength += len;

      const termFreqs = new Map();
      for (const term of tokens) {
        termFreqs.set(term, (termFreqs.get(term) || 0) + 1);
      }

      for (const [term, freq] of termFreqs.entries()) {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, new Map());
        }
        this.invertedIndex.get(term).set(i, freq);
      }
    }

    this.avgDocLength = totalLength / (this.docCount || 1);

    // Compute Robertson-Spärck Jones IDF
    for (const [term, postingList] of this.invertedIndex.entries()) {
      const docFreq = postingList.size;
      // idf = ln(1 + (N - n + 0.5) / (n + 0.5))
      const idfValue = Math.log(1 + (this.docCount - docFreq + 0.5) / (docFreq + 0.5));
      this.idf.set(term, Math.max(0.1, idfValue));
    }
  }

  /**
   * Retrieve the top-K relevant reviews matching a user discovery query
   * @param {string} query - User question / research prompt
   * @param {Object} options - Search options
   * @returns {Array<Object>} Ranked review results with scores and matched themes
   */
  search(query, options = {}) {
    const {
      topK = 20,
      filterTheme = null,
      filterSource = null,
      preferNegative = true // Boost pain/friction signals for barrier discovery
    } = options;

    const queryTokens = this.tokenize(query);
    const queryThemes = matchThemes(query);
    
    // Check if query is looking for obstacles/friction
    const isFrictionQuery = preferNegative && (
      query.toLowerCase().includes('barrier') ||
      query.toLowerCase().includes('prevent') ||
      query.toLowerCase().includes('uncertaint') ||
      query.toLowerCase().includes('postpone') ||
      query.toLowerCase().includes('why') ||
      query.toLowerCase().includes('problem') ||
      query.toLowerCase().includes('issue') ||
      query.toLowerCase().includes('hesitat')
    );

    const scores = new Float32Array(this.docCount);
    const matchedDocs = new Set();

    // 1. BM25 Lexical Scoring
    for (const term of queryTokens) {
      const postingList = this.invertedIndex.get(term);
      if (!postingList) continue;

      const termIdf = this.idf.get(term) || 0.1;

      for (const [docIdx, tf] of postingList.entries()) {
        const docLen = this.docLengths[docIdx];
        const num = tf * (this.k1 + 1);
        const denom = tf + this.k1 * (1 - this.b + this.b * (docLen / (this.avgDocLength || 1)));
        scores[docIdx] += termIdf * (num / denom);
        matchedDocs.add(docIdx);
      }
    }

    // 2. Thematic & Contextual Boosts
    for (const docIdx of matchedDocs) {
      const doc = this.documents[docIdx];

      // Filter by theme if specified
      if (filterTheme && (!doc.themes || !doc.themes.includes(filterTheme))) {
        scores[docIdx] = -1;
        continue;
      }

      // Filter by source if specified
      if (filterSource && doc.source !== filterSource) {
        scores[docIdx] = -1;
        continue;
      }

      // Boost if review shares detected query themes
      if (queryThemes.length > 0 && doc.themes) {
        for (const qt of queryThemes) {
          if (doc.themes.includes(qt)) {
            scores[docIdx] *= 1.35; // 35% theme congruence bonus
          }
        }
      }

      // Boost negative/friction evidence for problem-solving queries
      if (isFrictionQuery) {
        if (doc.sentiment === 'negative' || doc.rating <= 2) {
          scores[docIdx] *= 1.45; // 45% friction prioritization
        } else if (doc.sentiment === 'neutral' || doc.rating === 3) {
          scores[docIdx] *= 1.15;
        }
      }

      // Information density boost (reviews with descriptive text > 40 chars)
      if (doc.text.length > 80) {
        scores[docIdx] *= 1.15;
      }
    }

    // 3. Rank and Top-K extraction
    const rankedIndices = Array.from(matchedDocs)
      .filter(idx => scores[idx] > 0)
      .sort((a, b) => scores[b] - scores[a])
      .slice(0, topK);

    // Fallback if no lexical matches (e.g. broad theme query)
    if (rankedIndices.length < 5 && queryThemes.length > 0) {
      const targetTheme = queryThemes[0];
      for (let i = 0; i < this.docCount; i++) {
        if (rankedIndices.includes(i)) continue;
        const doc = this.documents[i];
        if (doc.themes && doc.themes.includes(targetTheme)) {
          rankedIndices.push(i);
          if (rankedIndices.length >= topK) break;
        }
      }
    }

    return rankedIndices.map(idx => ({
      ...this.documents[idx],
      relevanceScore: parseFloat((scores[idx] || 1.0).toFixed(3))
    }));
  }

  /**
   * Assemble grounded prompt context from retrieved reviews and dataset metrics
   * @param {string} query - User question
   * @param {Array<Object>} retrievedReviews - Top retrieved reviews
   * @param {Object} metrics - Global precomputed metrics
   * @returns {Object} Structured context payload
   */
  buildGroundedContext(query, retrievedReviews, metrics) {
    const formattedQuotes = retrievedReviews.map((r, idx) => {
      const themesList = (r.themes && r.themes.length > 0) ? r.themes.join(', ') : 'General Feedback';
      return `[Review #${idx + 1} | Source: ${r.source} | Rating: ${r.rating}★ | Date: ${r.date} | Themes: ${themesList}]\n"${r.text}"`;
    }).join('\n\n');

    // Summarize top themes from metrics
    const topThemes = Object.entries(metrics.themes || {})
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([name, data]) => `- ${name}: ${data.count} reviews (${data.percentage}%), Negative Pain: ${Math.round(data.pain_ratio * 100)}%`)
      .join('\n');

    const contextText = `
=== DATASET BASELINE METRICS (Docs/reviews.csv) ===
- Total Reviews: ${metrics.total_reviews}
- Average Rating: ${metrics.avg_rating} / 5.0
- Sources: Play Store (${metrics.sources.playstore || 0}), App Store (${metrics.sources.appstore || 0}), Reddit (${metrics.sources.reddit || 0})
- Sentiment Breakdown: Positive ${metrics.sentiment.percentages.positive}%, Neutral ${metrics.sentiment.percentages.neutral}%, Negative ${metrics.sentiment.percentages.negative}%

Top Recurring Themes Across Dataset:
${topThemes}

=== RETRIEVED VERBATIM CUSTOMER EVIDENCE (${retrievedReviews.length} Evidence Quotes) ===
${formattedQuotes || 'No direct matching reviews found for this specific query.'}
`.trim();

    return {
      query: query,
      retrievedCount: retrievedReviews.length,
      retrievedReviews: retrievedReviews,
      contextText: contextText
    };
  }
}
