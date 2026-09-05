import { EvidenceSynthesizer } from './synthesizer.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

/**
 * Groq LLM Inference & Discovery Engine Client
 * Automatically connects to backend /api/chat on Vercel or falls back to local synthesis.
 */
export class GroqEngine {
  /**
   * Execute discovery query using backend /api/chat on Vercel, or local synthesizer
   * @param {string} query - User question / prompt
   * @param {Object} contextPayload - Context object from HybridRetriever
   * @param {Object} metrics - Precomputed dataset metrics
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} Structured insight payload
   */
  static async query(query, contextPayload, metrics, options = {}) {
    const model = options.model || DEFAULT_MODEL;

    // 1. Try Vercel Serverless / Backend Route (/api/chat)
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, contextPayload, metrics, model })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.direct_answer) {
          return {
            ...data,
            engine_mode: 'live_groq',
            model_used: data.model_used || model
          };
        }
      }
    } catch {
      // Backend /api/chat endpoint not reachable (e.g. running via static file server)
    }

    // 2. Deterministic Local Evidence Synthesizer Fallback (Zero Latency & Always Grounded)
    const localResult = EvidenceSynthesizer.synthesize(query, contextPayload.retrievedReviews, metrics);
    return {
      ...localResult,
      engine_mode: 'local_deterministic',
      model_used: 'Local Evidence Synthesizer (Zero Latency)'
    };
  }
}
