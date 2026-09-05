import { THEME_TAXONOMY } from '../data/taxonomy.js';

/**
 * Analytical & Opportunity Prioritization Engine
 * Computes deterministic statistics, sentiment splits, theme distributions,
 * and multi-factor conversion opportunity matrices.
 */

/**
 * Compute global dataset statistics
 * @param {Array<Object>} reviews - Processed review records
 * @returns {Object} Full metrics object
 */
export function computeDatasetMetrics(reviews) {
  if (!reviews || reviews.length === 0) {
    return {
      total_reviews: 0,
      avg_rating: 0,
      sources: { playstore: 0, appstore: 0, reddit: 0 },
      ratings: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
      sentiment: { counts: { positive: 0, neutral: 0, negative: 0 }, percentages: { positive: 0, neutral: 0, negative: 0 } },
      themes: {}
    };
  }

  const total = reviews.length;
  const sources = { playstore: 0, appstore: 0, reddit: 0 };
  const ratings = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

  const themeData = {};
  for (const [themeName, meta] of Object.entries(THEME_TAXONOMY)) {
    themeData[themeName] = {
      id: meta.id,
      category: meta.category,
      barrierWeight: meta.barrierWeight,
      count: 0,
      percentage: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      pain_ratio: 0,
      opportunity_score: 0,
      sample_quotes: []
    };
  }

  let ratingSum = 0;

  for (let i = 0; i < total; i++) {
    const r = reviews[i];
    
    // Source count
    const src = r.source || 'other';
    if (sources[src] !== undefined) sources[src]++;
    else sources[src] = 1;

    // Rating distribution
    const rat = r.rating;
    ratingSum += rat;
    if (ratings[rat] !== undefined) ratings[rat]++;

    // Sentiment count
    const sent = r.sentiment;
    if (sentimentCounts[sent] !== undefined) sentimentCounts[sent]++;

    // Themes
    if (r.themes && Array.isArray(r.themes)) {
      for (const t of r.themes) {
        if (themeData[t]) {
          themeData[t].count++;
          themeData[t].sentiment[sent]++;

          // Collect high quality sample quotes
          if (themeData[t].sample_quotes.length < 15 && r.text && r.text.length > 25) {
            themeData[t].sample_quotes.push({
              quote: r.text,
              source: r.source,
              rating: r.rating,
              date: r.date
            });
          }
        }
      }
    }
  }

  const avgRating = parseFloat((ratingSum / total).toFixed(2));

  // Compute theme percentages, pain ratios, and opportunity scores
  for (const [themeName, t] of Object.entries(themeData)) {
    t.percentage = parseFloat(((t.count / total) * 100).toFixed(1));
    
    // Laplace-smoothed pain ratio: (negative + 1) / (total_in_theme + 2)
    const smoothedNeg = t.sentiment.negative + 1;
    const smoothedTotal = t.count + 2;
    t.pain_ratio = parseFloat((smoothedNeg / smoothedTotal).toFixed(2));

    // Multi-factor Opportunity Matrix: (Frequency^0.7) * (Pain^1.5) * BarrierWeight * 10
    const freqFactor = Math.pow(t.percentage, 0.7);
    const painFactor = Math.pow(t.pain_ratio, 1.5);
    const rawScore = freqFactor * painFactor * (t.barrierWeight || 1.0) * 10;
    t.opportunity_score = parseFloat(Math.min(10, Math.max(0.1, rawScore)).toFixed(1));
  }

  return {
    total_reviews: total,
    avg_rating: avgRating,
    sources: sources,
    ratings: ratings,
    sentiment: {
      counts: sentimentCounts,
      percentages: {
        positive: parseFloat(((sentimentCounts.positive / total) * 100).toFixed(1)),
        neutral: parseFloat(((sentimentCounts.neutral / total) * 100).toFixed(1)),
        negative: parseFloat(((sentimentCounts.negative / total) * 100).toFixed(1))
      }
    },
    themes: themeData
  };
}

/**
 * Rank themes by Opportunity Score (Conversion Impact)
 * @param {Object} themeData 
 * @returns {Array<Object>} Sorted list of opportunities
 */
export function getRankedOpportunities(themeData) {
  return Object.entries(themeData)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.opportunity_score - a.opportunity_score);
}
