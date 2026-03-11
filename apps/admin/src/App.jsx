import { useEffect, useMemo, useRef, useState } from "react";
import { affiliateConfig, tabs } from "../../../packages/catalog/index.js";
import {
  clearCatalogOverrides,
  clearGiftOverride,
  getMergedGifts,
  hasGiftOverride,
  readCatalogOverrides,
  saveGiftOverride,
  subscribeToCatalogUpdates,
  writeCatalogOverrides,
} from "../../../packages/catalog/storage.js";

const allTab = "all";

function matchesSearch(gift, search) {
  if (!search) return true;

  const query = search.toLowerCase().trim();
  const haystack = [
    gift.code,
    gift.name,
    gift.badge,
    gift.hook,
    gift.why,
    gift.bestFor,
    gift.vibe,
    gift.priceLabel,
    gift.query,
    ...(gift.relationships || []),
    ...(gift.intents || []),
    ...(gift.tabs || []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildDraft(gift) {
  if (!gift) {
    return {
      name: "",
      badge: "",
      bestFor: "",
      vibe: "",
      priceLabel: "",
      priceValue: "",
      query: "",
      hook: "",
      why: "",
      relationships: "",
      intents: "",
      tabs: "",
      accentFrom: "",
      accentTo: "",
    };
  }

  return {
    name: gift.name || "",
    badge: gift.badge || "",
    bestFor: gift.bestFor || "",
    vibe: gift.vibe || "",
    priceLabel: gift.priceLabel || "",
    priceValue: String(gift.priceValue ?? ""),
    query: gift.query || "",
    hook: gift.hook || "",
    why: gift.why || "",
    relationships: (gift.relationships || []).join(", "),
    intents: (gift.intents || []).join(", "),
    tabs: (gift.tabs || []).join(", "),
    accentFrom: gift.accentFrom || "",
    accentTo: gift.accentTo || "",
  };
}

function parseList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const fileInputRef = useRef(null);
  const [catalogGifts, setCatalogGifts] = useState(() => getMergedGifts());
  const [overrideMap, setOverrideMap] = useState(() => readCatalogOverrides());
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState(allTab);
  const [selectedId, setSelectedId] = useState(getMergedGifts()[0]?.id ?? null);
  const [draft, setDraft] = useState(() => buildDraft(getMergedGifts()[0] || null));

  const filteredGifts = useMemo(() => {
    return catalogGifts.filter((gift) => {
      const matchesTab = activeTab === allTab ? true : gift.tabs.includes(activeTab);
      return matchesTab && matchesSearch(gift, search);
    });
  }, [activeTab, catalogGifts, search]);

  const selectedGift = filteredGifts.find((gift) => gift.id === selectedId)
    || catalogGifts.find((gift) => gift.id === selectedId)
    || filteredGifts[0]
    || catalogGifts[0]
    || null;

  useEffect(() => {
    setDraft(buildDraft(selectedGift));
    if (selectedGift && selectedId !== selectedGift.id) {
      setSelectedId(selectedGift.id);
    }
  }, [selectedGift, selectedId]);

  const under100Count = catalogGifts.filter((gift) => gift.priceValue <= 100).length;
  const premiumCount = catalogGifts.filter((gift) => gift.priceValue > 100).length;
  const averagePrice = Math.round(
    catalogGifts.reduce((sum, gift) => sum + gift.priceValue, 0) / Math.max(catalogGifts.length, 1)
  );

  useEffect(() => {
    return subscribeToCatalogUpdates(() => {
      refreshCatalog();
    });
  }, []);

  function refreshCatalog(nextOverrides = readCatalogOverrides()) {
    setOverrideMap(nextOverrides);
    setCatalogGifts(getMergedGifts(nextOverrides));
  }

  function updateDraft(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function saveDraft() {
    if (!selectedGift) return;

    const nextPatch = {
      name: draft.name.trim(),
      badge: draft.badge.trim(),
      bestFor: draft.bestFor.trim(),
      vibe: draft.vibe.trim(),
      priceLabel: draft.priceLabel.trim(),
      priceValue: Number(draft.priceValue) || 0,
      query: draft.query.trim(),
      hook: draft.hook.trim(),
      why: draft.why.trim(),
      relationships: parseList(draft.relationships),
      intents: parseList(draft.intents),
      tabs: parseList(draft.tabs),
      accentFrom: draft.accentFrom.trim(),
      accentTo: draft.accentTo.trim(),
    };

    const nextOverrides = saveGiftOverride(selectedGift.id, nextPatch);
    refreshCatalog(nextOverrides);
  }

  function resetItem() {
    if (!selectedGift) return;
    const nextOverrides = clearGiftOverride(selectedGift.id);
    refreshCatalog(nextOverrides);
  }

  function resetAllDrafts() {
    clearCatalogOverrides();
    refreshCatalog({});
  }

  function exportOverrides() {
    downloadJson("giftsher-overrides.json", overrideMap);
  }

  function exportMergedCatalog() {
    downloadJson("giftsher-catalog.json", {
      affiliateConfig,
      tabs,
      gifts: catalogGifts,
    });
  }

  function triggerImport() {
    fileInputRef.current?.click();
  }

  function importOverrides(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return;
        }

        writeCatalogOverrides(parsed);
        refreshCatalog(parsed);
      } catch (error) {
        return;
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="ga-app">
      <header className="surface ga-header">
        <div className="ga-header-copy">
          <div className="ga-mark">GS</div>
          <div>
            <p className="ga-label">Catalog studio</p>
            <h1>GiftSher admin</h1>
            <p>
              Readable product operations for the buyer app. Review the catalog, inspect each item, and edit fields without touching source code.
            </p>
          </div>
        </div>
        <div className="ga-tag">{affiliateConfig.merchantName} • {affiliateConfig.tag}</div>
      </header>

      <section className="ga-metrics">
        <article className="surface ga-metric-card">
          <p className="ga-label">Catalog size</p>
          <strong>{catalogGifts.length}</strong>
          <span>Live gift entries</span>
        </article>
        <article className="surface ga-metric-card">
          <p className="ga-label">Under $100</p>
          <strong>{under100Count}</strong>
          <span>Core buyer lane</span>
        </article>
        <article className="surface ga-metric-card">
          <p className="ga-label">Premium</p>
          <strong>{premiumCount}</strong>
          <span>Higher-spend options</span>
        </article>
        <article className="surface ga-metric-card">
          <p className="ga-label">Average price</p>
          <strong>{formatCurrency(averagePrice)}</strong>
          <span>{Object.keys(overrideMap).length} local overrides</span>
        </article>
      </section>

      <main className="ga-workspace">
        <section className="surface ga-list-shell">
          <div className="ga-panel-head">
            <div>
              <p className="ga-label">Browse</p>
              <h2>Catalog inventory</h2>
            </div>
            <div className="ga-count">{filteredGifts.length} shown</div>
          </div>

          <div className="ga-toolbar">
            <input
              className="ga-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="search product, badge, vibe, query..."
            />
            <div className="ga-tabs">
              <button
                type="button"
                className={`ga-tab ${activeTab === allTab ? "is-active" : ""}`}
                onClick={() => setActiveTab(allTab)}
              >
                All
              </button>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`ga-tab ${activeTab === tab.id ? "is-active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ga-list">
            {filteredGifts.length ? (
              filteredGifts.map((gift) => (
                <button
                  key={gift.id}
                  type="button"
                  className={`ga-row ${selectedGift?.id === gift.id ? "is-active" : ""}`}
                  onClick={() => setSelectedId(gift.id)}
                >
                  <div className="ga-row-top">
                    <span className="ga-code">{gift.code}</span>
                    <span className="ga-price">{gift.priceLabel}</span>
                  </div>
                  <strong>{gift.name}</strong>
                  <p>{gift.hook}</p>
                  {hasGiftOverride(gift.id, overrideMap) ? <span className="ga-status">Local override</span> : null}
                </button>
              ))
            ) : (
              <div className="ga-empty">No catalog items match this search.</div>
            )}
          </div>
        </section>

        <aside className="ga-detail-stack">
          <section className="surface ga-detail-card">
            {selectedGift ? (
              <>
                <div className="ga-panel-head">
                  <div>
                    <p className="ga-label">Selected item</p>
                    <h2>{selectedGift.name}</h2>
                  </div>
                  <div className="ga-dual-pills">
                    <span className="ga-code">{selectedGift.code}</span>
                    <span className="ga-price">{selectedGift.priceLabel}</span>
                  </div>
                </div>

                <div className="ga-detail-hero" style={{ background: `linear-gradient(145deg, ${selectedGift.accentFrom}, ${selectedGift.accentTo})` }}>
                  <p>{selectedGift.badge}</p>
                  <strong>{selectedGift.vibe}</strong>
                  <span>{selectedGift.bestFor}</span>
                </div>

                <div className="ga-copy-block">
                  <div>
                    <p className="ga-label">Hook</p>
                    <p>{selectedGift.hook}</p>
                  </div>
                  <div>
                    <p className="ga-label">Why it wins</p>
                    <p>{selectedGift.why}</p>
                  </div>
                </div>

                <div className="ga-meta-grid">
                  <div className="ga-meta-card">
                    <span className="ga-label">Relationships</span>
                    <strong>{selectedGift.relationships.join(" • ")}</strong>
                  </div>
                  <div className="ga-meta-card">
                    <span className="ga-label">Intent</span>
                    <strong>{selectedGift.intents.join(" • ")}</strong>
                  </div>
                  <div className="ga-meta-card">
                    <span className="ga-label">Tabs</span>
                    <strong>{selectedGift.tabs.join(" • ")}</strong>
                  </div>
                  <div className="ga-meta-card">
                    <span className="ga-label">Search query</span>
                    <strong>{selectedGift.query}</strong>
                  </div>
                </div>

                <div className="ga-editor-shell">
                  <div className="ga-panel-head">
                    <div>
                      <p className="ga-label">Editor</p>
                      <h2>Local override</h2>
                    </div>
                    {hasGiftOverride(selectedGift.id, overrideMap) ? <div className="ga-status">Edited locally</div> : null}
                  </div>

                  <div className="ga-editor-grid">
                    <label className="ga-field">
                      <span>Name</span>
                      <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} />
                    </label>
                    <label className="ga-field">
                      <span>Badge</span>
                      <input value={draft.badge} onChange={(event) => updateDraft("badge", event.target.value)} />
                    </label>
                    <label className="ga-field">
                      <span>Best for</span>
                      <input value={draft.bestFor} onChange={(event) => updateDraft("bestFor", event.target.value)} />
                    </label>
                    <label className="ga-field">
                      <span>Vibe</span>
                      <input value={draft.vibe} onChange={(event) => updateDraft("vibe", event.target.value)} />
                    </label>
                    <label className="ga-field">
                      <span>Price label</span>
                      <input value={draft.priceLabel} onChange={(event) => updateDraft("priceLabel", event.target.value)} />
                    </label>
                    <label className="ga-field">
                      <span>Price value</span>
                      <input type="number" value={draft.priceValue} onChange={(event) => updateDraft("priceValue", event.target.value)} />
                    </label>
                    <label className="ga-field ga-field-wide">
                      <span>Search query</span>
                      <input value={draft.query} onChange={(event) => updateDraft("query", event.target.value)} />
                    </label>
                    <label className="ga-field ga-field-wide">
                      <span>Hook</span>
                      <textarea rows="3" value={draft.hook} onChange={(event) => updateDraft("hook", event.target.value)} />
                    </label>
                    <label className="ga-field ga-field-wide">
                      <span>Why it wins</span>
                      <textarea rows="4" value={draft.why} onChange={(event) => updateDraft("why", event.target.value)} />
                    </label>
                    <label className="ga-field ga-field-wide">
                      <span>Relationships</span>
                      <input value={draft.relationships} onChange={(event) => updateDraft("relationships", event.target.value)} />
                    </label>
                    <label className="ga-field ga-field-wide">
                      <span>Intents</span>
                      <input value={draft.intents} onChange={(event) => updateDraft("intents", event.target.value)} />
                    </label>
                    <label className="ga-field ga-field-wide">
                      <span>Tabs</span>
                      <input value={draft.tabs} onChange={(event) => updateDraft("tabs", event.target.value)} />
                    </label>
                    <label className="ga-field">
                      <span>Accent from</span>
                      <input value={draft.accentFrom} onChange={(event) => updateDraft("accentFrom", event.target.value)} />
                    </label>
                    <label className="ga-field">
                      <span>Accent to</span>
                      <input value={draft.accentTo} onChange={(event) => updateDraft("accentTo", event.target.value)} />
                    </label>
                  </div>

                  <div className="ga-actions">
                    <button type="button" className="ga-action ga-action-primary" onClick={saveDraft}>Save local override</button>
                    <button type="button" className="ga-action" onClick={resetItem}>Reset item</button>
                    <button type="button" className="ga-action ga-action-danger" onClick={resetAllDrafts}>Reset all overrides</button>
                  </div>
                </div>
              </>
            ) : (
              <div className="ga-empty">Select a product to inspect it here.</div>
            )}
          </section>

          <section className="surface ga-config-card">
            <div className="ga-panel-head">
              <div>
                <p className="ga-label">Affiliate config</p>
                <h2>Current setup</h2>
              </div>
            </div>

            <div className="ga-config-list">
              <div className="ga-config-row">
                <span>Merchant</span>
                <strong>{affiliateConfig.merchantName}</strong>
              </div>
              <div className="ga-config-row">
                <span>Tag</span>
                <strong>{affiliateConfig.tag}</strong>
              </div>
              <div className="ga-config-row">
                <span>Base URL</span>
                <strong>{affiliateConfig.baseUrl}</strong>
              </div>
              <div className="ga-config-row">
                <span>Persistence</span>
                <strong>Browser-local override store</strong>
              </div>
            </div>

            <div className="ga-actions">
              <button type="button" className="ga-action ga-action-primary" onClick={exportOverrides}>Export overrides</button>
              <button type="button" className="ga-action" onClick={exportMergedCatalog}>Export merged catalog</button>
              <button type="button" className="ga-action" onClick={triggerImport}>Import overrides</button>
              <input ref={fileInputRef} className="ga-file-input" type="file" accept="application/json" onChange={importOverrides} />
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
