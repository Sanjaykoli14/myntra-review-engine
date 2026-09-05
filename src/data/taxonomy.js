/**
 * 12 Strategic Themes for Myntra Wishlist & Review Analysis
 * Derived from context.md, Problemstatement.md, and Docs/reviews.csv
 */
export const THEME_TAXONOMY = {
  "Fit & Size Uncertainty": {
    id: "fit_size",
    name: "Fit & Size Uncertainty",
    description: "Sizing chart inaccuracies, body-type variation, tight/loose fits, inconsistent brand measurements.",
    keywords: [
      "fit", "fitting", "size", "sizing", "tight", "loose", "chart", "size chart", 
      "measurement", "large", "small", "length", "waist", "chest", "mismatch", 
      "body", "fitting is good", "wrong size", "too big", "too small", "fit issue"
    ],
    hinglish: ["fitting sahi nahi", "size chhota", "size bada", "size galat"],
    barrierWeight: 1.5,
    category: "Product Evaluation"
  },
  "Price & Discounts": {
    id: "price_discounts",
    name: "Price & Discounts",
    description: "Price drop expectations, platform fees, coupon validity, surge pricing, value perception.",
    keywords: [
      "price", "discount", "cost", "expensive", "coupon", "sale", "offer", "cheap", 
      "worth", "cashback", "charges", "platform fee", "surge", "mrp", "deal", 
      "price drop", "convenience fee", "costly", "overpriced"
    ],
    hinglish: ["mehenga", "sasta", "paisa barbad", "paisa", "loot", "rate"],
    barrierWeight: 1.3,
    category: "Financial / Commercial"
  },
  "Product Quality & Fabric": {
    id: "quality_fabric",
    name: "Product Quality & Fabric",
    description: "Material transparency, fabric thickness, wash durability, color fidelity, counterfeit concerns.",
    keywords: [
      "quality", "material", "fabric", "cloth", "original", "fake", "duplicate", 
      "color", "fade", "torn", "damaged", "defect", "good fabric", "cheap quality", 
      "poor quality", "genuine", "authentic", "durability", "stitch", "threads"
    ],
    hinglish: ["kharab", "badhiya", "nakli", "asli", "ghatiya", "bekar material"],
    barrierWeight: 1.4,
    category: "Product Evaluation"
  },
  "Reviews & Ratings Reliability": {
    id: "reviews_ratings",
    name: "Reviews & Ratings Reliability",
    description: "Trust in user ratings, fake reviews, lack of authentic customer photos, sparse feedback for new items.",
    keywords: [
      "review", "rating", "fake review", "photos", "images", "stars", "comments", 
      "customer photo", "trust", "trusted", "real review", "no photo", "ratings"
    ],
    hinglish: ["review dekh ke", "fake star", "fraud rating"],
    barrierWeight: 1.2,
    category: "Information & Trust"
  },
  "Styling & Outfit Compatibility": {
    id: "styling_outfit",
    name: "Styling & Outfit Compatibility",
    description: "Outfit pairing, aesthetic matching, trend relevance, styling guidance, complete look visualization.",
    keywords: [
      "style", "styling", "look", "looks", "fashion", "outfit", "match", 
      "combination", "pair", "wear", "design", "latest collection", "trending style", 
      "super", "fabulous", "gorgeous", "stylish"
    ],
    hinglish: ["mast look", "acha lag raha", "achha style"],
    barrierWeight: 1.1,
    category: "Aspirational / Styling"
  },
  "Occasion-Based Purchasing": {
    id: "occasion_purchase",
    name: "Occasion-Based Purchasing",
    description: "Event-driven timelines (weddings, festivals, vacations, parties) with urgent delivery reliance.",
    keywords: [
      "wedding", "party", "festival", "event", "office", "birthday", "occasion", 
      "function", "trip", "vacation", "urgent", "diwali", "puja", "eid", "urgent delivery"
    ],
    hinglish: ["shadi", "function ke liye", "tyohar"],
    barrierWeight: 1.3,
    category: "Contextual Need"
  },
  "Social Validation": {
    id: "social_validation",
    name: "Social Validation",
    description: "Peer approval, influencer recommendations, compliments, viral trends, gift suitability.",
    keywords: [
      "compliment", "friend", "family", "trend", "trending", "influencer", "gift", 
      "recommend", "everyone", "peer", "viral", "gifted", "people liked"
    ],
    hinglish: ["sabne tareef ki", "dost ne bola", "gift diya"],
    barrierWeight: 1.0,
    category: "Social Psychological"
  },
  "Return & Exchange Anxiety": {
    id: "return_exchange",
    name: "Return & Exchange Anxiety",
    description: "Return policy friction, delayed pickups, refund stalling, exchange size unavailability, customer care.",
    keywords: [
      "return", "exchange", "refund", "pickup", "replace", "money back", "cancelled", 
      "return policy", "no action", "scam", "fraud", "delivery boy", "wrong product", 
      "cheat", "refund not received", "agent", "customer care", "customer support"
    ],
    hinglish: ["return nahi hua", "paisa wapas", "refund atka", "dhokhadhadi"],
    barrierWeight: 1.6,
    category: "Post-Purchase & Service"
  },
  "Product Comparison": {
    id: "product_comparison",
    name: "Product Comparison",
    description: "Cross-platform price/deal comparison (e.g. Myntra vs AJIO, Amazon, Flipkart, Zara, H&M).",
    keywords: [
      "compare", "comparison", "ajio", "amazon", "flipkart", "zara", "h&m", "meesho", 
      "other app", "better than", "other site", "cheaper on", "price difference"
    ],
    hinglish: ["doosre app pe", "ajio se sasta", "amazon pe better"],
    barrierWeight: 1.2,
    category: "Market Competition"
  },
  "Stock & Availability": {
    id: "stock_availability",
    name: "Stock & Availability",
    description: "Out-of-stock sizes, frequent stockouts of wishlisted items, delayed restock alerts.",
    keywords: [
      "out of stock", "stock", "unavailable", "sold out", "size not available", 
      "restock", "notify", "quantity", "stock finish"
    ],
    hinglish: ["stock khatam", "size nahi mil raha"],
    barrierWeight: 1.3,
    category: "Inventory Friction"
  },
  "Wishlist as Bookmarking": {
    id: "wishlist_bookmarking",
    name: "Wishlist as Bookmarking",
    description: "Saving items without immediate buying intent (aesthetic hoarding, wishlist as a moodboard).",
    keywords: [
      "wishlist", "wishlisted", "saved", "save for later", "cart", "shortlist", 
      "bookmark", "buying later", "delay", "postpone", "later", "add to cart", "saved items"
    ],
    hinglish: ["wishlist me daal diya", "baad me kharidenge", "save karke rakha"],
    barrierWeight: 1.1,
    category: "Behavioral Habit"
  },
  "Information Deficit": {
    id: "information_deficit",
    name: "Information Deficit",
    description: "Missing fabric composition, care instructions, exact dimension guides, misleading product images.",
    keywords: [
      "information", "detail", "description", "fabric blend", "care instruction", 
      "dimension", "specification", "clear info", "misleading", "incomplete info", "details"
    ],
    hinglish: ["detail nahi diya", "galat photo", "adhuri jankari"],
    barrierWeight: 1.2,
    category: "Information & Trust"
  }
};

/**
 * Helper to match text against all themes
 * @param {string} text 
 * @returns {Array<string>} Array of matched theme names
 */
export function matchThemes(text) {
  if (!text) return [];
  const normalized = text.toLowerCase();
  const matched = [];

  for (const [themeName, data] of Object.entries(THEME_TAXONOMY)) {
    const hasKeyword = data.keywords.some(kw => normalized.includes(kw));
    const hasHinglish = data.hinglish && data.hinglish.some(h => normalized.includes(h));
    if (hasKeyword || hasHinglish) {
      matched.push(themeName);
    }
  }

  return matched;
}
