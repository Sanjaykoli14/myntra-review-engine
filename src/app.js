import { parseCSV } from './data/parser.js';
import { computeDatasetMetrics } from './engine/analytics.js';
import { HybridRetriever } from './engine/retriever.js';
import { GroqEngine } from './engine/groq.js';
import { SidebarView } from './ui/sidebar.js';
import { ModalManager } from './ui/modal.js';
import { ChatView } from './ui/chat.js';

/**
 * Main Application Orchestrator
 */
class DiscoveryApp {
  constructor() {
    this.reviews = [];
    this.metrics = null;
    this.retriever = null;
    this.sidebar = null;
    this.chat = null;
    this.modal = null;
  }

  async init() {
    console.log('🚀 Initializing Myntra Review & Discovery Engine...');

    // 1. Initialize UI Handlers & Modals
    this.initUIComponents();

    // 2. Load Dataset & Baseline Metrics
    await this.loadDataset();

    console.log('✨ Engine ready. Total reviews loaded:', this.reviews.length);
  }

  initUIComponents() {
    const sidebarEl = document.getElementById('sidebar-container');
    const chatFeedEl = document.getElementById('chat-feed-container');
    const chatInputEl = document.getElementById('chat-input-field');
    const sendBtnEl = document.getElementById('btn-send-chat');

    // Sidebar View
    this.sidebar = new SidebarView(sidebarEl, (themeName) => {
      this.chat.submitQuery(`What are the key customer complaints and conversion barriers regarding "${themeName}" in Myntra reviews?`);
    });

    // Chat View
    this.chat = new ChatView(chatFeedEl, chatInputEl, sendBtnEl, async (query) => {
      return this.handleQuery(query);
    });

    // Modals
    this.modal = new ModalManager(
      (pillarQuery) => this.chat.submitQuery(pillarQuery)
    );

    // Strategic pillars button
    const btnAllPillars = document.getElementById('btn-open-all-pillars');
    if (btnAllPillars) {
      btnAllPillars.addEventListener('click', () => this.modal.openPillarsModal());
    }
  }

  async loadDataset() {
    // 1. Try loading from window.PRECOMPUTED_METRICS & window.SAMPLE_REVIEWS (Fast zero-latency path)
    if (window.PRECOMPUTED_METRICS && window.SAMPLE_REVIEWS) {
      this.metrics = window.PRECOMPUTED_METRICS;
      this.reviews = window.SAMPLE_REVIEWS;
      this.retriever = new HybridRetriever(this.reviews);
      this.sidebar.render(this.metrics);
      return;
    }

    // 2. Fallback: Fetch Docs/reviews.csv directly
    try {
      const response = await fetch('Docs/reviews.csv');
      if (response.ok) {
        const csvText = await response.text();
        this.reviews = parseCSV(csvText);
        this.metrics = computeDatasetMetrics(this.reviews);
        this.retriever = new HybridRetriever(this.reviews);
        this.sidebar.render(this.metrics);
      }
    } catch (err) {
      console.error('Error fetching Docs/reviews.csv:', err);
    }
  }

  async handleQuery(query) {
    if (!this.retriever) {
      throw new Error('Review dataset is still loading. Please try again in a moment.');
    }

    // 1. Hybrid RAG Search (BM25 + Thematic boost + Top-K evidence)
    const retrievedReviews = this.retriever.search(query, { topK: 25 });
    
    // 2. Build Grounded Context Payload
    const contextPayload = this.retriever.buildGroundedContext(query, retrievedReviews, this.metrics);

    // 3. Dispatch to Groq Engine (with automatic offline fallback)
    const response = await GroqEngine.query(query, contextPayload, this.metrics);

    return response;
  }
}

// Boot application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new DiscoveryApp();
  app.init();
});
