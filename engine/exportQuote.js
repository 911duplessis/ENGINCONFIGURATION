/* Export actions: print/PDF, WhatsApp share, and Kopano--compatible JSON. */

function exportToPdf() {
  window.print();
}

function buildWhatsAppMessage(quoteResult, pricingConfig, meta) {
  const lines = [];
  lines.push(`PrimeTurf SA — Instant Quote${meta.clientName ? ` for ${meta.clientName}` : ''}`);
  lines.push('');
  quoteResult.zones.forEach((z) => {
    lines.push(`${z.name}: ${formatSqm(z.sqm)} · ${z.specLabel || 'spec TBD'} — ${formatCurrency(z.subtotal, pricingConfig)}`);
  });
  lines.push('');
  lines.push(`Estimated total: ${formatCurrency(quoteResult.rangeLow, pricingConfig)} – ${formatCurrency(quoteResult.rangeHigh, pricingConfig)}`);
  if (!quoteResult.vatIncluded) lines.push('(Excl. VAT)');
  lines.push('');
  lines.push(pricingConfig.company.website);
  return lines.join('\n');
}

function exportToWhatsApp(quoteResult, pricingConfig, meta) {
  const text = buildWhatsAppMessage(quoteResult, pricingConfig, meta);
  const number = (pricingConfig.company.whatsapp || '').replace(/\D/g, '');
  const base = number ? `https://wa.me/${number}` : 'https://wa.me/';
  window.open(`${base}?text=${encodeURIComponent(text)}`, '_blank');
}

function generateQuoteId() {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PT-Q-${year}-${rand}`;
}

function complexityToTier(zone) {
  return zone.complexityLabel;
}

function toQuoteJSON(quoteResult, pricingConfig, meta) {
  return {
    quoteId: generateQuoteId(),
    date: new Date().toISOString().slice(0, 10),
    client: { name: meta.clientName || '', location: meta.location || '' },
    company: { name: pricingConfig.company.name, website: pricingConfig.company.website },
    zones: quoteResult.zones.map((z) => ({
      id: z.id,
      name: z.name,
      sqm: formatSqm(z.sqm),
      spec: z.specLabel,
      price: formatCurrency(z.subtotal, pricingConfig),
      tier: complexityToTier(z)
    })),
    totalPackage: {
      name: `All ${quoteResult.zones.length} Zone${quoteResult.zones.length === 1 ? '' : 's'}`,
      sqm: formatSqm(quoteResult.totalSqm),
      price: formatCurrency(quoteResult.subtotal, pricingConfig),
      note: `Range: ${formatCurrency(quoteResult.rangeLow, pricingConfig)}–${formatCurrency(quoteResult.rangeHigh, pricingConfig)}`
    },
    addons: quoteResult.globalAddons,
    raw: quoteResult
  };
}

function exportToJson(quoteResult, pricingConfig, meta) {
  const data = toQuoteJSON(quoteResult, pricingConfig, meta);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.quoteId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
