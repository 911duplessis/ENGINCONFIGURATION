/* Renders and binds the input form. Reads/writes `state` (engine/state.js),
   recalculates via `calcQuote` (engine/calc.js) on every change, and
   reports the live result back to the caller via onChange. */

function renderZoneCard(zone, pricingConfig) {
  const specOptions = pricingConfig.turfSpecs
    .map((s) => `<option value="${s.id}" ${zone.specId === s.id ? 'selected' : ''}>${escapeHtml(s.label)}</option>`)
    .join('');

  const complexityRadios = Object.entries(pricingConfig.complexityMultipliers)
    .map(([key, c]) => `
      <label class="pt-radio">
        <input type="radio" name="complexity-${zone.id}" value="${key}" ${zone.complexity === key ? 'checked' : ''}>
        <span>${escapeHtml(c.label)}</span>
      </label>
    `).join('');

  const addonChecks = pricingConfig.addons.perZone
    .map((a) => `
      <label class="pt-checkbox">
        <input type="checkbox" data-zone-addon="${a.id}" ${zone.addonIds.includes(a.id) ? 'checked' : ''}>
        <span>${escapeHtml(a.label)}</span>
      </label>
    `).join('');

  return `
    <div class="zone-card" data-zone-id="${zone.id}">
      <div class="zone-card-head">
        <input type="text" class="zone-name-input" data-field="name" placeholder="Zone name (e.g. Front Lawn)" value="${escapeHtml(zone.name)}">
        <button type="button" class="zone-remove" data-action="remove-zone" aria-label="Remove zone">&times;</button>
      </div>
      <div class="zone-dims">
        <label>Length (m)<input type="number" inputmode="decimal" min="0" step="0.1" data-field="lengthM" value="${zone.lengthM ?? ''}"></label>
        <label>Width (m)<input type="number" inputmode="decimal" min="0" step="0.1" data-field="widthM" value="${zone.widthM ?? ''}"></label>
        <label>Or enter m² directly<input type="number" inputmode="decimal" min="0" step="0.1" data-field="sqmOverride" value="${zone.sqmOverride ?? ''}"></label>
      </div>
      <label class="zone-spec-label">Turf Spec
        <select data-field="specId">
          <option value="">Select a spec…</option>
          ${specOptions}
        </select>
      </label>
      <div class="zone-complexity">
        <div class="pt-field-label">Installation Complexity</div>
        ${complexityRadios}
      </div>
      <div class="zone-addons">
        <div class="pt-field-label">Add-ons</div>
        ${addonChecks}
      </div>
      <div class="zone-subtotal" data-zone-subtotal>—</div>
    </div>
  `;
}

function renderGlobalAddons(pricingConfig, state) {
  const checks = pricingConfig.addons.global
    .map((a) => `
      <label class="pt-checkbox">
        <input type="checkbox" data-global-addon="${a.id}" ${state.globalAddonIds.includes(a.id) ? 'checked' : ''}>
        <span>${escapeHtml(a.label)}${a.note ? ` <em>(${escapeHtml(a.note)})</em>` : ''}</span>
      </label>
    `).join('');
  return `
    <div class="global-addons">
      <div class="pt-field-label">Whole-Project Add-ons</div>
      ${checks}
    </div>
  `;
}

function renderForm(state, pricingConfig) {
  return `
    <div class="zone-list">
      ${state.zones.map((z) => renderZoneCard(z, pricingConfig)).join('')}
    </div>
    <button type="button" class="pt-btn pt-btn-outline" data-action="add-zone">+ Add Zone</button>
    ${renderGlobalAddons(pricingConfig, state)}
  `;
}

function readZoneFieldValue(input) {
  if (input.type === 'number') {
    return input.value === '' ? null : parseFloat(input.value);
  }
  return input.value;
}

function mountForm(state, pricingConfig, onChange) {
  const root = document.getElementById('quote-form');

  function rerender() {
    root.innerHTML = renderForm(state, pricingConfig);
    bindEvents();
    onChange();
  }

  function bindEvents() {
    root.querySelectorAll('[data-zone-id]').forEach((card) => {
      const zoneId = card.getAttribute('data-zone-id');

      card.querySelectorAll('[data-field]').forEach((input) => {
        input.addEventListener('input', () => {
          updateZone(state, zoneId, { [input.getAttribute('data-field')]: readZoneFieldValue(input) });
          onChange();
        });
      });

      card.querySelectorAll('input[type="radio"][name^="complexity-"]').forEach((radio) => {
        radio.addEventListener('change', () => {
          if (radio.checked) {
            updateZone(state, zoneId, { complexity: radio.value });
            onChange();
          }
        });
      });

      card.querySelectorAll('[data-zone-addon]').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          toggleZoneAddon(state, zoneId, checkbox.getAttribute('data-zone-addon'));
          onChange();
        });
      });

      const removeBtn = card.querySelector('[data-action="remove-zone"]');
      removeBtn.addEventListener('click', () => {
        if (state.zones.length <= 1) return;
        removeZone(state, zoneId);
        rerender();
      });
    });

    root.querySelectorAll('[data-global-addon]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        toggleGlobalAddon(state, checkbox.getAttribute('data-global-addon'));
        onChange();
      });
    });

    const addBtn = root.querySelector('[data-action="add-zone"]');
    addBtn.addEventListener('click', () => {
      addZone(state, pricingConfig);
      rerender();
    });
  }

  rerender();

  return {
    updateZoneSubtotals(quoteResult) {
      quoteResult.zones.forEach((z) => {
        const el = root.querySelector(`[data-zone-id="${z.id}"] [data-zone-subtotal]`);
        if (el) el.textContent = `Subtotal: ${formatCurrency(z.subtotal, pricingConfig)}`;
      });
    }
  };
}
