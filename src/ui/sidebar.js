/**
 * Left Sidebar: Dataset Overview & Thematic Dashboard Renderer
 */
export class SidebarView {
  /**
   * @param {HTMLElement} container - Sidebar container DOM element
   * @param {Function} onThemeSelect - Callback when user clicks a theme card
   */
  constructor(container, onThemeSelect) {
    this.container = container;
    this.onThemeSelect = onThemeSelect;
  }

  /**
   * Render sidebar with precomputed/analyzed metrics
   * @param {Object} metrics - Global metrics object
   */
  render(metrics) {
    if (!this.container || !metrics) return;

    const { total_reviews, avg_rating, sources, sentiment, themes } = metrics;
    const posPct = sentiment?.percentages?.positive || 83.5;
    const neuPct = sentiment?.percentages?.neutral || 1.2;
    const negPct = sentiment?.percentages?.negative || 15.3;

    // Sort themes by count / impact
    const themeEntries = Object.entries(themes || {})
      .sort((a, b) => b[1].count - a[1].count);

    this.container.innerHTML = `
      <!-- Header -->
      <div class="sidebar-header">
        <h2>Dataset Overview</h2>
        <span class="badge-source">Docs/reviews.csv</span>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card" id="metric-total-reviews">
          <span class="metric-label">📊 Total Reviews</span>
          <span class="metric-value">${Number(total_reviews).toLocaleString()}</span>
          <span class="metric-sub">Single-Source Truth</span>
        </div>
        <div class="metric-card" id="metric-avg-rating">
          <span class="metric-label">⭐ Avg. Rating</span>
          <span class="metric-value">${avg_rating} <small style="font-size:14px;color:var(--text-muted)">/ 5.0</small></span>
          <span class="metric-sub">Customer Satisfaction</span>
        </div>
      </div>

      <!-- Sentiment Distribution -->
      <div class="sentiment-card" id="sentiment-breakdown-card">
        <div class="theme-top-row">
          <span class="metric-label">💖 Sentiment Splits</span>
          <span style="font-size:12.5px;color:var(--text-secondary)">${total_reviews} samples</span>
        </div>
        <div class="sentiment-bar-container">
          <div class="sentiment-bar-segment pos" style="width: ${posPct}%" title="Positive: ${posPct}%"></div>
          <div class="sentiment-bar-segment neu" style="width: ${neuPct}%" title="Neutral: ${neuPct}%"></div>
          <div class="sentiment-bar-segment neg" style="width: ${negPct}%" title="Negative: ${negPct}%"></div>
        </div>
        <div class="sentiment-legend">
          <div class="legend-item"><span class="legend-dot pos"></span> Pos: ${posPct}%</div>
          <div class="legend-item"><span class="legend-dot neu"></span> Neu: ${neuPct}%</div>
          <div class="legend-item"><span class="legend-dot neg"></span> Neg: ${negPct}%</div>
        </div>
      </div>

      <!-- Source Platform Distribution -->
      <div class="source-section">
        <span class="source-title">Source Platform Breakdown</span>
        <div class="source-list">
          <div class="source-item">
            <div class="source-meta">
              <span>📱 Google Play Store</span>
            </div>
            <span class="source-count">${(sources?.playstore || 1547).toLocaleString()} (${Math.round(((sources?.playstore || 1547) / total_reviews) * 100)}%)</span>
          </div>
          <div class="source-item">
            <div class="source-meta">
              <span>🍏 Apple App Store</span>
            </div>
            <span class="source-count">${(sources?.appstore || 646).toLocaleString()} (${Math.round(((sources?.appstore || 646) / total_reviews) * 100)}%)</span>
          </div>
          <div class="source-item">
            <div class="source-meta">
              <span>💬 Community / Reddit</span>
            </div>
            <span class="source-count">${(sources?.reddit || 56).toLocaleString()} (${Math.round(((sources?.reddit || 56) / total_reviews) * 100)}%)</span>
          </div>
        </div>
      </div>

      <!-- Top Recurring Themes -->
      <div class="theme-section">
        <div class="theme-title-row">
          <span class="source-title">Top Recurring Themes</span>
          <span style="font-size:12px;color:var(--text-muted)">Click to analyze</span>
        </div>
        <div class="theme-list" id="theme-list-container">
          ${themeEntries.map(([themeName, t]) => {
            const painPct = Math.round((t.pain_ratio || 0.5) * 100);
            let painClass = 'med';
            if (painPct >= 60) painClass = 'high';
            else if (painPct <= 25) painClass = 'low';

            return `
              <div class="theme-item" data-theme="${encodeURIComponent(themeName)}" title="Click to ask AI about ${themeName}">
                <div class="theme-top-row">
                  <span class="theme-name">${themeName}</span>
                  <span class="theme-pct-badge">${t.percentage}%</span>
                </div>
                <div class="theme-progress-track">
                  <div class="theme-progress-fill" style="width: ${Math.min(100, t.percentage * 3.5)}%"></div>
                </div>
                <div class="theme-footer">
                  <span>${t.count} reviews</span>
                  <span class="pain-chip ${painClass}">Pain: ${painPct}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Attach click handlers to theme cards
    this.container.querySelectorAll('.theme-item').forEach(el => {
      el.addEventListener('click', () => {
        const themeName = decodeURIComponent(el.getAttribute('data-theme'));
        if (this.onThemeSelect) {
          this.onThemeSelect(themeName);
        }
      });
    });
  }
}
