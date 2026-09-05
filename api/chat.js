const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

/**
 * Vercel Serverless Function Handler for Groq AI Inference
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !apiKey.startsWith('gsk_')) {
    return res.status(401).json({ 
      error: 'GROQ_API_KEY is not configured in environment variables.',
      fallback_needed: true 
    });
  }

  try {
    const { query, contextPayload, metrics } = req.body || {};
    if (!query || !contextPayload) {
      return res.status(400).json({ error: 'Missing query or contextPayload in request body' });
    }

    const systemPrompt = `
You are the "Myntra Review & Discovery Engine AI", an expert fashion e-commerce Product Analyst and Discovery Specialist.
Your primary objective is to analyze customer reviews in "Docs/reviews.csv" to identify why users save products to their Wishlist but do not purchase them, and recommend high-impact product solutions to increase 30-day wishlist-to-purchase conversions.

CRITICAL GROUNDING & ZERO-HALLUCINATION RULES:
1. Ground all claims STRICTLY in the provided customer evidence context and metrics.
2. DO NOT fabricate demographic details unless explicitly in the text.
3. Every quote in "evidence_quotes" MUST be an exact verbatim excerpt from context.
4. Always produce a practical, evidence-grounded Opportunity Analysis with an impact score (1-10) and 2-4 concrete PM action items.
5. Return ONLY a single valid JSON object adhering strictly to the JSON schema below.

JSON SCHEMA:
{
  "direct_answer": "Concise executive PM summary directly addressing the question with key evidence.",
  "identified_themes": [
    {
      "name": "Theme Name",
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

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
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
      return res.status(response.status).json({ 
        error: `Groq upstream error: ${response.status}`,
        details: errText,
        fallback_needed: true
      });
    }

    const data = await response.json();
    const contentStr = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const parsedJSON = JSON.parse(contentStr);

    // Recursively sanitize all strings against Mojibake / encoding glitches
    const sanitizeObj = (obj) => {
      if (typeof obj === 'string') {
        return obj
          .replace(/â\x80\x93|â\x80\x94|â\x80\x92|â\x80\x95|â€“|â€”|â€\x93|â€\x94/g, '—')
          .replace(/â\x80\x98|â\x80\x99|â\x80\x9A|â\x80\x9B|â€˜|â€™|â€\x99|â€\x98/g, "'")
          .replace(/â\x80\x9C|â\x80\x9D|â\x80\x9E|â\x80\x9F|â€œ|â€\x9D|â€\x9C|â€ |â€/g, '"')
          .replace(/â\x80\xA6|â€¦/g, '...')
          .replace(/â\x80\xA2|â€¢/g, '•')
          .replace(/Â/g, '')
          .replace(/[\uFFFD\u0080-\u009F]/g, '');
      } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObj);
      } else if (obj !== null && typeof obj === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
          out[k] = sanitizeObj(v);
        }
        return out;
      }
      return obj;
    };

    const sanitizedResult = sanitizeObj(parsedJSON);

    return res.status(200).json({
      ...sanitizedResult,
      engine_mode: 'live_groq',
      model_used: DEFAULT_MODEL,
      usage: data.usage
    });
  } catch (err) {
    console.error('Serverless Chat API Error:', err);
    return res.status(500).json({ 
      error: err.message,
      fallback_needed: true 
    });
  }
}
