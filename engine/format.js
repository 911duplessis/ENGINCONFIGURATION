/* Shared formatting helpers — no calculation, no DOM. */

function formatCurrency(value, pricingConfig) {
  const rounded = Math.round(value / 10) * 10;
  return `${pricingConfig.currencySymbol} ${rounded.toLocaleString('en-ZA')}`;
}

function formatSqm(value) {
  return `${Math.round(value * 100) / 100}m²`;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
