import { EvidenceSynthesizer } from './synthesizer.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const STORAGE_KEY = 'MYNTRA_GROQ_API_KEY';

/**
 * Groq LLM Inference & Discovery Engine Client
 */
export class GroqEngine {
  /**
   * Retrieve saved API key from localStorage
   * @returns {string|null}
   */
  static getApiKey() {
    try {
      return localStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  }

  /**
   * Save API key to localStorage
   * @param {string} apiKey 
   */
  static setApiKey(apiKey) {
    try {
      if (apiKey && apiKey.trim()) {
        localStorage.setItem(STORAGE_KEY, apiKey.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('LocalStorage unavailable for API key persistence:', e);
    }
  }

  /**
   * Clear saved API key
   */
  static clearApiKey() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  }

  /**
   * Check if Groq API key is present
   * @returns {boolean}
   */
  static hasApiKey() {
    const key = this.getApiKey();
    return Boolean(key && key.startsWith('gsk_'));
  }

  /**
   * Attempt to load API key from .env file if available
   */
  static async loadFromEnv() {
    if (this.hasApiKey()) return;

    try {
      const response = await fetch('.env');
      if (response.ok) {
        const text = await response.text();
        const match = text.match(/GROQ_API_KEY\s*=\s*(gsk_[a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          console.info('Auto-loaded Groq API key from .env');
          this.setApiKey(match[1]);
        }
      }
    } catch {
      // .env fetch silent catch
    }
  }

  /**
   * Execute discovery query using Groq LLM (with automatic fallback to local synthesizer)
   * @param {string} query - User question / prompt
   * @param {Object} contextPayload - Context object from HybridRetriever
   * @param {Object} metrics - Precomputed dataset metrics
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Structured insight payload
   */
  static async query(query, contextPayload, metrics, options = {}) {
    let apiKey = options.apiKey || this.getApiKey();
    const model = options.model || DEFAULT_MODEL;

    // Try auto-loading from .env if not found
    if (!apiKey) {
      await this.loadFromEnv();
      apiKey = this.getApiKey();
    }

    // Fallback immediately if no API key is provided
    if (!apiKey || !apiKey.startsWith('gsk_')) {
      console.info('No valid Groq API key found. Utilizing deterministic local analytical engine.');
      return {
        ...EvidenceSynthesizer.synthesize(query, contextPayload.retrievedReviews, metrics),
        engine_mode: 'local_deterministic',
        model_used: 'Local Evidence Synthesizer (Zero-Latency Fallback)'
      };
    }

    const systemPrompt = `
You are the "Myntra Review & Discovery Engine AI", an expert fashion e-commerce Product Analyst and Discovery Specialist.
Your primary objective is to analyze customer reviews in "Docs/reviews.csv" to identify why users save products to their Wishlist but do not purchase them, and recommend high-impact product solutions to increase 30-day wishlist-to-purchase conversions.

CRITICAL GROUNDING & ZERO-HALLUCINATION RULES:
1. Ground all claims STRICTLY in the provided === DATASET BASELINE METRICS === and === RETRIEVED VERBATIM CUSTOMER EVIDENCE ===.
2. DO NOT fabricate or extrapolate demographic or geographic details (e.g. age groups, specific cities) unless explicitly mentioned in the customer quotes. If unrepresented, state clearly: "The dataset does not contain sufficient demographic metadata for this segmentation."
3. Every quote cited in "evidence_quotes" MUST be an exact verbatim excerpt from the supplied review context, preserving the exact source and rating.
4. Always produce a practical, evidence-grounded Opportunity Analysis with an impact score (1-10) and 2-4 concrete PM action items.
5. Return ONLY a single valid JSON object adhering strictly to the JSON schema below. No introductory text, no markdown formatting outside JSON.

JSON SCHEMA:
{
  "direct_answer": "Concise executive PM summary directly addressing the question with key evidence.",
  "identified_themes": [
    {
      "name": "Theme Name (e.g., Fit & Size Uncertainty)",
      "frequency_pct": 15.5,
      "severity": "High" | "Medium" | "Low",
      "rationale": "Brief 1-line reason why this theme impacts wishlist conversion."
    }
  ],
  "evidence_quotes": [
    {
      "quote": "Exact verbatim quote from context",
      "source": "Play Store" | "App Store" | "Reddit",
      "rating": 1-5,
      "date": "YYYY-MM-DD",
      "theme": "Associated Theme"
    }
  ],
  "opportunity_analysis": {
    "primary_barrier": "Primary root-cause user pain or psychological friction.",
    "conversion_impact_score": 8.5,
    "recommended_actions": [
      "Actionable PM recommendation 1",
      "Actionable PM recommendation 2",
      "Actionable PM recommendation 3"
    ]
  },
  "quantified_metrics": {
    "total_matching_reviews": 20,
    "negative_sentiment_share": 65,
    "key_takeaway": "1-line data conclusion"
  }
}
`.trim();

    const userContent = `
USER DISCOVERY QUESTION:
"${query}"

${contextPayload.contextText}

Generate the structured JSON analysis following the schema above.
`.trim();

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.15,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Groq API Error (${response.status}):`, errText);
        
        // Fallback gracefully on API errors (rate limits, auth error, etc.)
        const localResult = EvidenceSynthesizer.synthesize(query, contextPayload.retrievedReviews, metrics);
        return {
          ...localResult,
          engine_mode: 'fallback_error',
          api_error: `Groq API status ${response.status}. Displaying grounded local synthesis.`,
          model_used: 'Local Evidence Synthesizer (Error Fallback)'
        };
      }

      const data = await response.json();
      const contentStr = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

      if (!contentStr) {
        throw new Error('Empty response content from Groq');
      }

      const parsedJSON = JSON.parse(contentStr);
      return {
        ...parsedJSON,
        engine_mode: 'live_groq',
        model_used: model,
        usage: data.usage
      };
    } catch (err) {
      console.error('Groq Engine execution error:', err);
      const localResult = EvidenceSynthesizer.synthesize(query, contextPayload.retrievedReviews, metrics);
      return {
        ...localResult,
        engine_mode: 'fallback_error',
        api_error: `Network/parse error: ${err.message}. Showing local grounded synthesis.`,
        model_used: 'Local Evidence Synthesizer (Network Fallback)'
      };
    }
  }
}
