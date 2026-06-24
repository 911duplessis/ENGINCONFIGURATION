/* Quote state container — plain object + mutation helpers, no DOM, no calculation. */

let zoneCounter = 0;

function generateZoneId() {
  zoneCounter += 1;
  return `zone-${zoneCounter}`;
}

function createZone(name) {
  return {
    id: generateZoneId(),
    name: name || '',
    lengthM: null,
    widthM: null,
    sqmOverride: null,
    specId: null,
    complexity: 'easy',
    addonIds: []
  };
}

function createInitialState(pricingConfig) {
  const defaultGlobalAddonIds = (pricingConfig.addons.global || [])
    .filter((a) => a.defaultOn)
    .map((a) => a.id);
  const firstZone = createZone('Zone 1');
  const defaultPerZoneAddonIds = (pricingConfig.addons.perZone || [])
    .filter((a) => a.defaultOn)
    .map((a) => a.id);
  firstZone.addonIds = defaultPerZoneAddonIds.slice();
  return {
    zones: [firstZone],
    globalAddonIds: defaultGlobalAddonIds
  };
}

function addZone(state, pricingConfig) {
  const zone = createZone(`Zone ${state.zones.length + 1}`);
  const defaultPerZoneAddonIds = (pricingConfig.addons.perZone || [])
    .filter((a) => a.defaultOn)
    .map((a) => a.id);
  zone.addonIds = defaultPerZoneAddonIds.slice();
  state.zones.push(zone);
  return zone;
}

function removeZone(state, zoneId) {
  state.zones = state.zones.filter((z) => z.id !== zoneId);
}

function updateZone(state, zoneId, patch) {
  const zone = state.zones.find((z) => z.id === zoneId);
  if (!zone) return;
  Object.assign(zone, patch);
}

function toggleZoneAddon(state, zoneId, addonId) {
  const zone = state.zones.find((z) => z.id === zoneId);
  if (!zone) return;
  const idx = zone.addonIds.indexOf(addonId);
  if (idx === -1) zone.addonIds.push(addonId);
  else zone.addonIds.splice(idx, 1);
}

function toggleGlobalAddon(state, addonId) {
  const idx = state.globalAddonIds.indexOf(addonId);
  if (idx === -1) state.globalAddonIds.push(addonId);
  else state.globalAddonIds.splice(idx, 1);
}
