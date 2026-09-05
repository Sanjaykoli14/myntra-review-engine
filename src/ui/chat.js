/**
 * Chat Workspace & Response Card Renderer
 */
export class ChatView {
  /**
   * @param {HTMLElement} feedContainer - Chat message container
   * @param {HTMLInputElement} inputEl - Chat search input element
   * @param {HTMLButtonElement} sendBtn - Send button
   * @param {Function} onSendMessage - Callback when user submits query
   */
  constructor(feedContainer, inputEl, sendBtn, onSendMessage) {
    this.feedContainer = feedContainer;
    this.inputEl = inputEl;
    this.sendBtn = sendBtn;
    this.onSendMessage = onSendMessage;
    this.isProcessing = false;

    this.initEvents();
  }

  initEvents() {
    if (this.sendBtn && this.inputEl) {
      this.sendBtn.addEventListener('click', () => this.handleUserSubmit());
      this.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleUserSubmit();
        }
      });
    }

    // Attach delegated click handlers for quick prompts
    document.querySelectorAll('.prompt-btn, .pillar-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query') || btn.textContent.trim();
        if (query) {
          this.submitQuery(query);
        }
      });
    });
  }

  handleUserSubmit() {
    if (this.isProcessing) return;
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.inputEl.value = '';
    this.submitQuery(text);
  }

  submitQuery(query) {
    if (this.isProcessing) return;
    this.renderUserMessage(query);
    this.setLoading(true);

    if (this.onSendMessage) {
      this.onSendMessage(query)
        .then(result => {
          this.setLoading(false);
          this.renderAIResponse(result);
        })
        .catch(err => {
          this.setLoading(false);
          this.renderErrorMessage(err.message || 'An error occurred during discovery synthesis.');
        });
    }
  }

  renderUserMessage(text) {
    // Hide welcome card once first message is submitted
    const welcome = document.getElementById('welcome-card');
    if (welcome) welcome.style.display = 'none';

    const row = document.createElement('div');
    row.className = 'message-row user';
    row.innerHTML = `
      <div class="user-bubble">${this.escapeHTML(text)}</div>
    `;
    this.feedContainer.appendChild(row);
    this.scrollToBottom();
  }

  setLoading(isLoading) {
    this.isProcessing = isLoading;
    if (this.sendBtn) this.sendBtn.disabled = isLoading;
    if (this.inputEl) this.inputEl.disabled = isLoading;

    const existingLoader = document.getElementById('chat-loading-indicator');
    if (isLoading && !existingLoader) {
      const loader = document.createElement('div');
      loader.id = 'chat-loading-indicator';
      loader.className = 'loading-indicator';
      loader.innerHTML = `
        <div class="spinner"></div>
        <span>Retrieving evidence & synthesizing insights from Docs/reviews.csv...</span>
      `;
      this.feedContainer.appendChild(loader);
      this.scrollToBottom();
    } else if (!isLoading && existingLoader) {
      existingLoader.remove();
    }
  }

  renderAIResponse(data) {
    const row = document.createElement('div');
    row.className = 'message-row ai';

    const isLiveGroq = data.engine_mode === 'live_groq';
    const badgeText = isLiveGroq ? '⚡ Groq LLaMA 3.3 70B' : '⚡ Local Evidence Synthesis';
    const modelTag = data.model_used || 'Evidence-Grounded Synthesizer';
    const opp = data.opportunity_analysis || {};
    const impactScore = opp.conversion_impact_score || 8.5;
    const actions = opp.recommended_actions || [];
    const themes = data.identified_themes || [];
    const quotes = data.evidence_quotes || [];

    row.innerHTML = `
      <div class="ai-response-card">
        <!-- Header -->
        <div class="ai-card-header">
          <div class="ai-card-title-group">
            <span class="ai-badge">${badgeText}</span>
            <span class="model-tag">${modelTag}</span>
          </div>
          <div class="ai-card-actions">
            <button class="btn-action-sm btn-copy-card" title="Copy Synthesis Text">📋 Copy Answer</button>
          </div>
        </div>

        <!-- Direct Executive Summary -->
        <div class="direct-answer-box">
          <strong>Executive Synthesis:</strong><br>
          ${this.escapeHTML(data.direct_answer || '')}
        </div>

        <!-- Key Identified Themes with % Impact -->
        ${themes.length > 0 ? `
          <div class="section-block">
            <span class="section-label">🏷️ Key Themes & Quantified Impact</span>
            <div class="themes-badge-cloud">
              ${themes.map(t => `
                <div class="theme-pill-card">
                  <span class="pill-name">${this.escapeHTML(t.name)}</span>
                  <span class="pill-stat">${t.frequency_pct || t.count}% reviews</span>
                  ${t.severity ? `<span class="pain-chip ${t.severity.toLowerCase()}">${t.severity} Impact</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Opportunity Prioritization Card -->
        <div class="opportunity-box">
          <div class="opportunity-header">
            <span class="section-label" style="color:#FFF;">🚀 Opportunity Prioritization & Next Steps</span>
            <span class="opportunity-score-badge">Impact Score: ${impactScore} / 10</span>
          </div>
          ${opp.primary_barrier ? `
            <div class="primary-barrier-text">
              <strong>Primary Conversion Barrier:</strong> ${this.escapeHTML(opp.primary_barrier)}
            </div>
          ` : ''}
          ${actions.length > 0 ? `
            <ul class="pm-actions-list">
              ${actions.map(action => `
                <li class="pm-action-item">${this.escapeHTML(action)}</li>
              `).join('')}
            </ul>
          ` : ''}
        </div>

        <!-- Supporting Verbatim Quotes Accordion -->
        ${quotes.length > 0 ? `
          <div class="section-block">
            <span class="section-label">📑 Verbatim Customer Evidence (${quotes.length} Citations)</span>
            <div class="evidence-container">
              ${quotes.map((q, idx) => `
                <div class="evidence-quote-card">
                  <div class="evidence-meta">
                    <span class="evidence-source-tag">
                      ${q.source.includes('Play') ? '📱' : (q.source.includes('App') ? '🍏' : '💬')} ${this.escapeHTML(q.source)}
                      &nbsp;|&nbsp;
                      <span class="star-rating">${'★'.repeat(Math.max(1, q.rating))}${'☆'.repeat(Math.max(0, 5 - q.rating))}</span>
                    </span>
                    <span style="color:var(--text-muted)">${q.theme || 'Review'} (${q.date || 'Recent'})</span>
                  </div>
                  <div class="evidence-text">"${this.escapeHTML(q.quote)}"</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Copy handler
    const copyBtn = row.querySelector('.btn-copy-card');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const textToCopy = `QUESTION: ${data.query}\n\nEXECUTIVE ANSWER:\n${data.direct_answer}\n\nPRIMARY BARRIER:\n${opp.primary_barrier}\n\nRECOMMENDED ACTIONS:\n${actions.join('\n- ')}`;
        navigator.clipboard.writeText(textToCopy).then(() => {
          copyBtn.textContent = '✓ Copied!';
          setTimeout(() => { copyBtn.textContent = '📋 Copy Answer'; }, 2000);
        });
      });
    }

    this.feedContainer.appendChild(row);
    this.scrollToBottom();
  }

  renderErrorMessage(errText) {
    const row = document.createElement('div');
    row.className = 'message-row ai';
    row.innerHTML = `
      <div class="ai-response-card" style="border-color: rgba(239, 71, 111, 0.4);">
        <div style="color: var(--accent-red); font-weight: 700; font-size: 15px;">⚠️ Discovery Synthesis Error</div>
        <div style="color: var(--text-secondary); font-size: 14.5px; line-height: 1.5;">${this.escapeHTML(errText)}</div>
      </div>
    `;
    this.feedContainer.appendChild(row);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.feedContainer.scrollTop = this.feedContainer.scrollHeight;
  }

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
