# Myntra Review & Discovery Engine

An AI-powered conversational review intelligence system designed for Product Managers to analyze customer feedback in `Docs/reviews.csv`, identify behavioral and psychological friction between wishlist intent and purchase conversions, and generate evidence-grounded product interventions.

---

## 🌟 Key Features

- **Dedicated Single-Source Dataset**: Analyzes **2,249 customer reviews** from `Docs/reviews.csv` (Google Play Store, Apple App Store, Reddit).
- **12 Strategic Research Themes**: Automated classification for Fit & Size, Price & Deals, Product Quality, Return/Exchange Anxiety, Social Validation, Wishlist as Bookmarking, and more.
- **Hybrid RAG Retrieval Engine**: In-memory BM25 lexical indexer ($k_1=1.2, b=0.75$) with thematic congruence boosting and Top-$K$ verbatim evidence extraction.
- **Groq LLM Reasoning**: Ultra-fast inference powered by `openai/gpt-oss-120b` with strict zero-hallucination guardrails and structured JSON output schema.
- **Deterministic Offline Fallback**: Instant local synthesis engine that operates with zero latency even without an active API key.
- **Modern Interactive Dashboard**: Sleek fashion-tech dark theme, metrics at a glance, sentiment distribution visualizer, quick prompt cards, and 10 Strategic Pillar Questions explorer.

---

## 🚀 Getting Started

### 1. Configure Groq API Key
You can configure your Groq API key in either of two ways:
1. **Directly via the Web UI**: Click the **⚙️ Configure Groq API** button in the top navigation bar and enter your key (it will be saved securely in browser `localStorage`).
2. **Via `.env` file**: Copy `.env.example` to `.env` and set `GROQ_API_KEY=gsk_...`.

### 2. Run the Application
Start the local server by running:
```powershell
powershell -ExecutionPolicy Bypass -File "server.ps1"
```
Or serve `index.html` using any local HTTP static server.

### 3. Open in Browser
Navigate to:
```
http://localhost:8080/
```

---

## 📁 Project Structure

```
Myntra Project/
├── index.html                   # Core web application interface
├── index.css                    # Modern vanilla CSS design system
├── src/
│   ├── app.js                   # Application orchestrator
│   ├── data/
│   │   ├── dataset.js           # Pre-indexed dataset module (2,249 reviews)
│   │   ├── parser.js            # RFC 4180 CSV parser & sentiment classifier
│   │   └── taxonomy.js          # 12-theme dictionary & keyword maps
│   ├── engine/
│   │   ├── analytics.js         # Deterministic metrics & opportunity calculator
│   │   ├── retriever.js         # Hybrid BM25 & semantic RAG retrieval
│   │   ├── groq.js              # Groq API client with grounding constraints
│   │   └── synthesizer.js       # Deterministic evidence synthesizer
│   └── ui/
│       ├── sidebar.js           # Left sidebar metrics & charts renderer
│       ├── chat.js              # Discovery chat & response card renderer
│       └── modal.js             # API key & 10 strategic questions modal
├── data/
│   └── metrics.json             # Precomputed aggregate statistics
├── Docs/
│   ├── reviews.csv              # Single-source reviews dataset (2,249 reviews)
│   ├── Myntra_reviews.csv       # Original source dataset copy
│   └── Problemstatement.txt     # Original source problem statement
├── .env.example                 # Environment variables template
├── .env                         # Local environment configuration (git-ignored)
├── .gitignore                   # Git ignore specifications
├── architecture.md              # Detailed system architecture & Mermaid diagrams
├── context.md                   # Project context, metrics & 10 research pillars
├── edge-case.md                 # Edge cases & mitigation strategies
├── implementation_plan.md       # Phase-wise execution milestones
└── walkthrough.md               # System walkthrough & verification guide
```

---

## 🔒 Security & Privacy
- Your `.env` and API keys are strictly excluded from git tracking via `.gitignore`.
- In the browser, the Groq API key is stored only in the user's private `localStorage` and never transmitted to any third party other than direct SSL requests to Groq API (`api.groq.com`).
