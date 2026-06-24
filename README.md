# PrimeTurf Quote Engine

A static, no-build instant-quote calculator for turf installations. Open
`index.html` directly or serve the repo with any static file server — no
framework, no backend, no build step.

This is intentionally a **separate application** from the Connection
Network Engine (`Kopano-` repo). That repo renders hand-authored proposal
*documents* from JSON. This repo *computes* a live quote from user input.
The only link between them is a shared JSON shape — see "Exporting into a
Connection Network proposal" below.

## Architecture

```
index.html            entry point — two view-states (form / summary), no routing
config/
  pricing.json         the ONE editable file: turf specs, rates, add-ons, VAT
engine/
  theme.css            PrimeTurf's own theme (forest green / gold), independent
                        CSS variables and class names from Kopano-'s theme.css
  format.js            currency/sqm formatting + HTML escaping helpers
  state.js             quote state container (zones[], globalAddonIds[]) + mutations
  calc.js               pure calculator: (state, pricingConfig) -> price breakdown.
                        No DOM access, no hardcoded company name — portable to a
                        future second vertical by swapping pricing.json only.
  form.js               renders/binds the input form, drives the live running total
  summary.js            renders the output/summary screen and live total bar
  exportQuote.js         PDF (print), WhatsApp share, and JSON export
  main.js               composition root — wires state, form, calc, summary together
```

## Editing pricing

Everything PrimeTurf-specific lives in `config/pricing.json` — turf specs
(supply/install rate per m²), complexity multipliers, per-zone and
whole-project add-ons (sqm-rated, linear-meter-rated, or flat), VAT
settings, and the quote range buffer. No JavaScript needs to change to
update rates.

**The rates currently in `pricing.json` are placeholder estimates**,
reverse-engineered from previously quoted zone prices to land in a
believable band. They must be replaced with PrimeTurf's real costed
supply/labour rates before this is used for customer-facing quoting.

## Calculation model

Per zone:

```
sqm        = lengthM * widthM        (or a manual m² override)
supplyCost = sqm * spec.supplyRatePerSqm
laborCost  = sqm * spec.installRatePerSqm * complexityMultiplier[zone.complexity]
addonsCost = sum of selected per-zone add-ons
zoneSubtotal = supplyCost + laborCost + addonsCost
```

Grand total = sum of all zone subtotals + whole-project add-ons, then a
± `quoteRangeBufferPct` band is applied (real installs vary with site
conditions), plus VAT if `vatIncluded` is `false`.

## Exporting into a Connection Network proposal

Clicking **Export JSON** downloads a file shaped like:

```json
{
  "quoteId": "PT-Q-2026-1234",
  "client": { "name": "...", "location": "..." },
  "zones": [
    { "id": "zone-1", "name": "Front Lawn", "sqm": "72m²", "spec": "40mm Outdoor Pro", "price": "R 76,000", "tier": "Easy — open, flat, regular shape" }
  ],
  "totalPackage": { "name": "All 1 Zone", "sqm": "72m²", "price": "R 76,000", "note": "Range: R 66,880–R 85,120" }
}
```

To use this inside a Kopano- proposal: paste `zones` and `totalPackage`
directly into a `modules[]` entry's `zones`/`totalPackage` fields, and set
that module's `partner`, `accentColor`, `logo`, `website`, and `deckUrl`
by hand. The coupling between the two apps is this JSON shape only — no
shared code, no shared repo.

## Deployment

`.github/workflows/deploy-pages.yml` deploys this repo to GitHub Pages on
every push to `main` (or the active dev branch) — same pattern as Kopano-.
