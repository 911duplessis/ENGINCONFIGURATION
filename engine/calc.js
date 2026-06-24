/* Pricing calculator — pure functions. (state, pricingConfig) in, breakdown object out.
   No DOM access and no vertical-specific literals: portable to a future second config. */

function resolveSqm(zone) {
  if (zone.sqmOverride != null && zone.sqmOverride > 0) return zone.sqmOverride;
  if (zone.lengthM > 0 && zone.widthM > 0) return zone.lengthM * zone.widthM;
  return 0;
}

function resolvePerimeterM(zone) {
  if (zone.lengthM > 0 && zone.widthM > 0) return 2 * (zone.lengthM + zone.widthM);
  return 0;
}

function findSpec(specId, pricingConfig) {
  return pricingConfig.turfSpecs.find((s) => s.id === specId) || null;
}

function findAddon(addonId, list) {
  return list.find((a) => a.id === addonId) || null;
}

function calcAddonCost(addon, sqm, perimeterM) {
  if (addon.unit === 'sqm') return sqm * addon.ratePerSqm;
  if (addon.unit === 'lm') return perimeterM * addon.ratePerLm;
  if (addon.unit === 'flat') return addon.flatRate;
  return 0;
}

function calcZone(zone, pricingConfig) {
  const sqm = resolveSqm(zone);
  const perimeterM = resolvePerimeterM(zone);
  const spec = findSpec(zone.specId, pricingConfig);
  const multiplierEntry = pricingConfig.complexityMultipliers[zone.complexity] ||
    pricingConfig.complexityMultipliers.easy;

  const supplyCost = spec ? sqm * spec.supplyRatePerSqm : 0;
  const laborCost = spec ? sqm * spec.installRatePerSqm * multiplierEntry.laborMultiplier : 0;

  const addonLines = (zone.addonIds || [])
    .map((id) => findAddon(id, pricingConfig.addons.perZone))
    .filter(Boolean)
    .map((addon) => ({
      id: addon.id,
      label: addon.label,
      cost: calcAddonCost(addon, sqm, perimeterM)
    }));

  const addonsCost = addonLines.reduce((sum, l) => sum + l.cost, 0);
  const subtotal = supplyCost + laborCost + addonsCost;

  return {
    id: zone.id,
    name: zone.name || zone.id,
    sqm,
    perimeterM,
    specId: zone.specId,
    specLabel: spec ? spec.label : null,
    complexity: zone.complexity,
    complexityLabel: multiplierEntry.label,
    supplyCost,
    laborCost,
    addonLines,
    addonsCost,
    subtotal
  };
}

function calcGlobalAddons(globalAddonIds, totalPerimeterM, pricingConfig) {
  return (globalAddonIds || [])
    .map((id) => findAddon(id, pricingConfig.addons.global))
    .filter(Boolean)
    .map((addon) => ({
      id: addon.id,
      label: addon.label,
      note: addon.note || null,
      cost: calcAddonCost(addon, 0, totalPerimeterM)
    }));
}

function calcQuote(state, pricingConfig) {
  const zones = state.zones.map((z) => calcZone(z, pricingConfig));
  const totalSqm = zones.reduce((sum, z) => sum + z.sqm, 0);
  const totalPerimeterM = zones.reduce((sum, z) => sum + z.perimeterM, 0);

  const globalAddons = calcGlobalAddons(state.globalAddonIds, totalPerimeterM, pricingConfig);
  const globalAddonsCost = globalAddons.reduce((sum, a) => sum + a.cost, 0);

  let subtotal = zones.reduce((sum, z) => sum + z.subtotal, 0) + globalAddonsCost;
  if (subtotal > 0 && subtotal < pricingConfig.minimumJobValue) {
    subtotal = pricingConfig.minimumJobValue;
  }

  const buffer = pricingConfig.quoteRangeBufferPct || 0;
  const rangeLow = subtotal * (1 - buffer);
  const rangeHigh = subtotal * (1 + buffer);

  const vat = pricingConfig.vatIncluded ? 0 : subtotal * pricingConfig.vatRate;
  const grandTotalLow = rangeLow + (pricingConfig.vatIncluded ? 0 : rangeLow * pricingConfig.vatRate);
  const grandTotalHigh = rangeHigh + (pricingConfig.vatIncluded ? 0 : rangeHigh * pricingConfig.vatRate);

  return {
    zones,
    globalAddons,
    totalSqm,
    totalPerimeterM,
    subtotal,
    rangeLow,
    rangeHigh,
    vat,
    vatIncluded: pricingConfig.vatIncluded,
    grandTotalLow,
    grandTotalHigh
  };
}
