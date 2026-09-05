/**
 * 10 Strategic Research Pillars from Problemstatement.md
 */
export const STRATEGIC_PILLAR_QUESTIONS = [
  {
    id: 1,
    title: "1. Wishlist Intent & Motivation",
    query: "Why do users add fashion products to their wishlist in the first place?",
    desc: "Understand aspirational saving vs. active cart preparation."
  },
  {
    id: 2,
    title: "2. Root Purchase Barriers",
    query: "What prevents wishlisted products from eventually being purchased?",
    desc: "Uncover top friction points causing checkout drop-offs."
  },
  {
    id: 3,
    title: "3. Post-Selection Uncertainties",
    query: "What uncertainties remain after users have identified a product they like?",
    desc: "Sizing doubts, fabric transparency, and color fidelity hesitation."
  },
  {
    id: 4,
    title: "4. Postponement & Delay Drivers",
    query: "What causes users to postpone a purchase?",
    desc: "Sale waiting, coupon search, and seasonal timing delays."
  },
  {
    id: 5,
    title: "5. Multi-Product Comparison Dynamics",
    query: "How do users compare multiple shortlisted products?",
    desc: "Cross-brand comparisons and shortlist pruning behavior."
  },
  {
    id: 6,
    title: "6. External Information Seeking",
    query: "What information do users seek outside Myntra/AJIO before purchasing?",
    desc: "YouTube try-on hauls, Reddit feedback, and influencer styling."
  },
  {
    id: 7,
    title: "7. Decision Factors Breakdown",
    query: "What role do fit, size, styling, price, reviews, occasion, and social validation play in purchase decisions?",
    desc: "Weighting of product attributes on conversion."
  },
  {
    id: 8,
    title: "8. Wishlist vs. Bookmarking",
    query: "When is the wishlist used as genuine purchase intent versus simply as a bookmarking mechanism?",
    desc: "Separating high-intent buyers from casual moodboard hoarders."
  },
  {
    id: 9,
    title: "9. User Segment Variations",
    query: "How do these behaviors differ across user segments?",
    desc: "Discount-sensitive vs convenience-focused customer differences."
  },
  {
    id: 10,
    title: "10. Core Unmet Needs",
    query: "What unmet needs emerge consistently across user conversations?",
    desc: "Key feature and service opportunities to prioritize."
  }
];

/**
 * Modal & Drawer Manager
 */
export class ModalManager {
  /**
   * @param {Function} onPillarSelect - Callback when user clicks a strategic question
   */
  constructor(onPillarSelect) {
    this.onPillarSelect = onPillarSelect;
    this.initModals();
  }

  initModals() {
    this.pillarsModal = document.getElementById('pillars-modal');

    // Close buttons
    document.querySelectorAll('.btn-close, .btn-cancel-modal').forEach(btn => {
      btn.addEventListener('click', () => this.closeAll());
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) this.closeAll();
      });
    });

    // Populate Strategic Pillars Grid
    const pillarsContainer = document.getElementById('strategic-pillars-list');
    if (pillarsContainer) {
      pillarsContainer.innerHTML = STRATEGIC_PILLAR_QUESTIONS.map(q => `
        <div class="strategic-q-card" data-query="${encodeURIComponent(q.query)}">
          <span class="strategic-q-num">${q.title}</span>
          <span class="strategic-q-text">${q.query}</span>
          <span style="font-size:13px;color:var(--text-secondary);line-height:1.4;">${q.desc}</span>
        </div>
      `).join('');

      pillarsContainer.querySelectorAll('.strategic-q-card').forEach(el => {
        el.addEventListener('click', () => {
          const query = decodeURIComponent(el.getAttribute('data-query'));
          this.closeAll();
          if (this.onPillarSelect) {
            this.onPillarSelect(query);
          }
        });
      });
    }
  }

  openPillarsModal() {
    if (this.pillarsModal) {
      this.pillarsModal.classList.add('active');
    }
  }

  closeAll() {
    document.querySelectorAll('.modal-backdrop').forEach(el => el.classList.remove('active'));
  }
}
