/* Composition root: loads config, wires state -> form -> calc -> summary/export. */

async function init() {
  const pricingConfig = await fetch('config/pricing.json').then((r) => r.json());
  const state = createInitialState(pricingConfig);

  let formHandle = null;
  let lastResult = null;

  function recalc() {
    lastResult = calcQuote(state, pricingConfig);
    renderLiveTotal(lastResult, pricingConfig);
    if (formHandle) formHandle.updateZoneSubtotals(lastResult);
  }

  formHandle = mountForm(state, pricingConfig, recalc);
  recalc();

  document.getElementById('get-quote-btn').addEventListener('click', () => {
    recalc();
    const meta = {
      clientName: document.getElementById('client-name-input').value,
      location: document.getElementById('client-location-input').value
    };
    if (window.ptTrack) {
      const midpoint = Math.round(((lastResult.grandTotalLow + lastResult.grandTotalHigh) / 2) / 10) * 10;
      ptTrack('get_quote', {
        currency: 'ZAR',
        value: midpoint,
        total_sqm: Math.round(lastResult.totalSqm),
        zones: lastResult.zones.length
      });
    }
    showSummaryScreen(lastResult, pricingConfig, {
      onExportPdf: () => exportToPdf(),
      onExportWhatsApp: () => exportToWhatsApp(lastResult, pricingConfig, meta),
      onExportJson: () => exportToJson(lastResult, pricingConfig, meta)
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
