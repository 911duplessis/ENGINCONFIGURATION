/* Renders the live total bar and the full summary/output screen. */

function renderLiveTotal(quoteResult, pricingConfig) {
  const bar = document.getElementById('live-total-bar');
  bar.innerHTML = `
    <div class="live-total-label">Estimated Total</div>
    <div class="live-total-value">${formatCurrency(quoteResult.grandTotalLow, pricingConfig)} – ${formatCurrency(quoteResult.grandTotalHigh, pricingConfig)}</div>
  `;
}

function renderZoneBreakdownRow(zone, pricingConfig) {
  const addonRows = zone.addonLines.map((a) => `
    <div class="breakdown-line breakdown-line-addon">
      <span>${escapeHtml(a.label)}</span>
      <span>${formatCurrency(a.cost, pricingConfig)}</span>
    </div>
  `).join('');

  return `
    <div class="breakdown-zone">
      <div class="breakdown-zone-head">
        <div class="breakdown-zone-name">${escapeHtml(zone.name)}</div>
        <div class="breakdown-zone-meta">${formatSqm(zone.sqm)} · ${escapeHtml(zone.specLabel || 'No spec selected')} · ${escapeHtml(zone.complexityLabel)}</div>
      </div>
      <div class="breakdown-line">
        <span>Turf Supply</span>
        <span>${formatCurrency(zone.supplyCost, pricingConfig)}</span>
      </div>
      <div class="breakdown-line">
        <span>Installation Labour</span>
        <span>${formatCurrency(zone.laborCost, pricingConfig)}</span>
      </div>
      ${addonRows}
      <div class="breakdown-line breakdown-line-subtotal">
        <span>Zone Subtotal</span>
        <span>${formatCurrency(zone.subtotal, pricingConfig)}</span>
      </div>
    </div>
  `;
}

function renderGlobalAddonRows(globalAddons, pricingConfig) {
  if (!globalAddons.length) return '';
  return `
    <div class="breakdown-zone">
      <div class="breakdown-zone-head">
        <div class="breakdown-zone-name">Whole-Project Add-ons</div>
      </div>
      ${globalAddons.map((a) => `
        <div class="breakdown-line">
          <span>${escapeHtml(a.label)}${a.note ? ` <em>(${escapeHtml(a.note)})</em>` : ''}</span>
          <span>${formatCurrency(a.cost, pricingConfig)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderSummary(quoteResult, pricingConfig) {
  const vatLine = quoteResult.vatIncluded
    ? ''
    : `<div class="summary-vat-note">EXCL. VAT (${Math.round(pricingConfig.vatRate * 100)}%) — added at invoicing</div>`;

  return `
    <div class="summary-total">
      <div class="summary-total-label">Estimated Quote Range</div>
      <div class="summary-total-value">${formatCurrency(quoteResult.rangeLow, pricingConfig)} – ${formatCurrency(quoteResult.rangeHigh, pricingConfig)}</div>
      <div class="summary-total-sub">${formatSqm(quoteResult.totalSqm)} total across ${quoteResult.zones.length} zone${quoteResult.zones.length === 1 ? '' : 's'}</div>
      ${vatLine}
    </div>
    <div class="summary-breakdown">
      ${quoteResult.zones.map((z) => renderZoneBreakdownRow(z, pricingConfig)).join('')}
      ${renderGlobalAddonRows(quoteResult.globalAddons, pricingConfig)}
    </div>
    <div class="summary-actions">
      <button type="button" class="pt-btn pt-btn-outline" data-action="back-to-edit">&larr; Back to Edit</button>
      <button type="button" class="pt-btn pt-btn-gold" data-action="export-pdf">Download PDF</button>
      <button type="button" class="pt-btn pt-btn-primary" data-action="export-whatsapp">Send via WhatsApp</button>
      <button type="button" class="pt-btn pt-btn-outline" data-action="export-json">Export JSON</button>
    </div>
  `;
}

function showSummaryScreen(quoteResult, pricingConfig, callbacks) {
  document.getElementById('quote-form-view').classList.add('hidden');
  document.getElementById('quote-summary-view').classList.remove('hidden');
  document.getElementById('live-total-bar').classList.add('hidden');
  const root = document.getElementById('quote-summary');
  root.innerHTML = renderSummary(quoteResult, pricingConfig);

  root.querySelector('[data-action="back-to-edit"]').addEventListener('click', () => {
    document.getElementById('quote-summary-view').classList.add('hidden');
    document.getElementById('quote-form-view').classList.remove('hidden');
    document.getElementById('live-total-bar').classList.remove('hidden');
  });
  root.querySelector('[data-action="export-pdf"]').addEventListener('click', callbacks.onExportPdf);
  root.querySelector('[data-action="export-whatsapp"]').addEventListener('click', callbacks.onExportWhatsApp);
  root.querySelector('[data-action="export-json"]').addEventListener('click', callbacks.onExportJson);
}
