# Myntra Review & Discovery Engine — System Walkthrough

The **Myntra Review & Discovery Engine** is an AI-powered conversational analytics application designed for Product Managers to analyze customer feedback in `Docs/reviews.csv`, identify friction between wishlist intent and purchase conversion, and generate evidence-grounded recommendations.

---

## 1. Summary of Implemented Capabilities

### 1.1. Data Ingestion & Deterministic Pipeline (Phase 1)
- **Dataset**: Ingested and indexed **2,249 customer reviews** directly from `Docs/reviews.csv`.
- **Metrics**: Computed baseline statistics (Average Rating: **3.43 / 5.0**, Play Store: **1,547 (68.8%)**, App Store: **646 (28.7%)**, Reddit: **56 (2.5%)**, Positive: **60.7%**, Neutral: **1.2%**, Negative: **38.0%**).
- **12-Theme Taxonomy Classifier**: Implemented bilingual (English & Hinglish) classification mapping reviews against the 12 strategic research themes.
- **Opportunity Matrix**: Computed Laplace-smoothed conversion opportunity scores ($\text{Frequency}^{0.7} \times \text{Pain}^{1.5} \times \text{Barrier Weight}$).

### 1.2. Hybrid RAG Retrieval Engine (Phase 2)
- **BM25 Lexical Indexer**: Inverted index with Robertson-Spärck Jones IDF calculation ($k_1=1.2, b=0.75$).
- **Thematic Congruence & Friction Prioritizer**: Grants $+35\%$ score boost for query-theme alignment and $+45\%$ boost for negative review evidence on barrier queries.
- **Context Builder & Evidence Extractor**: Dynamic top-$K$ evidence extractor with metadata tags (date, source, rating, themes).

### 1.3. Groq LLM Inference & Synthesis Engine (Phase 3)
- **Inference Client**: Integrated Groq API client (`llama-3.3-70b-versatile`) with JSON schema enforcement.
- **Zero-Hallucination Guardrail**: Strict grounding system prompt restricting responses to provided review quotes and baseline metrics.
- **Secure Key Manager**: Browser `localStorage` persistence with zero-latency deterministic local fallback engine.

### 1.4. Modern Interactive Dashboard (Phase 4)
- **Left Sidebar**: Live metrics at a glance, sentiment distribution segmented bar, source platform cards, and ranked theme list.
- **Discovery Interface**:
  - **4 Default Quick Questions**: Instant single-click discovery queries.
  - **+ Explore All 10 Strategic Questions Modal**: Complete 10-pillar research framework.
  - **Structured AI Response Cards**: Executive PM synthesis, theme impact chips, collapsible verbatim quote citations with star ratings, opportunity impact score meters, and actionable PM checklist.
  - **Bottom Search Bar**: Free-form discovery input with keyboard shortcuts (`Enter`).

---

## 2. File & Component Architecture

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Web Interface** | [index.html](file:///c:/Users/user/Myntra%20Project/index.html) | Semantic layout with navbar, sidebar, chat feed, quick prompt buttons, and modals. |
| **Design System** | [index.css](file:///c:/Users/user/Myntra%20Project/index.css) | Modern fashion-tech dark design system with Myntra pink/coral gradients and glassmorphism. |
| **App Entrypoint** | [src/app.js](file:///c:/Users/user/Myntra%20Project/src/app.js) | Application orchestrator connecting dataset, retriever, Groq engine, and UI components. |
| **Taxonomy** | [src/data/taxonomy.js](file:///c:/Users/user/Myntra%20Project/src/data/taxonomy.js) | 12-theme strategic dictionary, Hinglish mapping, and barrier weights. |
| **CSV Parser** | [src/data/parser.js](file:///c:/Users/user/Myntra%20Project/src/data/parser.js) | RFC 4180 multiline CSV parser, text cleaner, and dual-signal sentiment classifier. |
| **Analytics Engine** | [src/engine/analytics.js](file:///c:/Users/user/Myntra%20Project/src/engine/analytics.js) | Deterministic metric aggregation and Laplace-smoothed opportunity scoring. |
| **RAG Retriever** | [src/engine/retriever.js](file:///c:/Users/user/Myntra%20Project/src/engine/retriever.js) | Hybrid BM25 lexical + semantic search with Top-$K$ evidence extractor. |
| **Groq Engine** | [src/engine/groq.js](file:///c:/Users/user/Myntra%20Project/src/engine/groq.js) | Groq LLaMA 3.3 70B inference client with grounding prompt and fallback mode. |
| **Synthesizer** | [src/engine/synthesizer.js](file:///c:/Users/user/Myntra%20Project/src/engine/synthesizer.js) | Deterministic evidence synthesizer for instant zero-latency responses. |
| **UI Components** | [src/ui/sidebar.js](file:///c:/Users/user/Myntra%20Project/src/ui/sidebar.js), [chat.js](file:///c:/Users/user/Myntra%20Project/src/ui/chat.js), [modal.js](file:///c:/Users/user/Myntra%20Project/src/ui/modal.js) | Interactive UI view controllers and card renderers. |

---

## 3. Running & Accessing the Application

The web application server is actively running at:
$$\text{\textbf{http://localhost:8080/}}$$

You can open this URL in any modern browser (Chrome, Edge, Firefox, Brave) to interact with the discovery engine, ask custom questions, or connect your Groq API key.
