import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bookmark, BookmarkCheck, MapPin, Play } from "lucide-react";
import {
  buildAffiliateLink,
  classNames,
  loadSaved,
  matchesBudget,
  persistSaved,
  readLiveCatalog,
  scoreGift,
  subscribeToCatalogUpdates,
} from "./lib/catalog.js";

const slides = [
  { id: "popular", label: "Popular", number: "01" },
  { id: "hot", label: "Hot", number: "02" },
  { id: "guides", label: "Guides", number: "03" },
  { id: "saved", label: "Saved", number: "04" },
];

const editorialSlides = slides.filter((slide) => slide.id !== "saved");

const relationshipOptions = [
  { id: "girlfriend", label: "Girlfriend", note: "Lower pressure, cleaner yes, easier first hit." },
  { id: "wife", label: "Wife", note: "Better room for stronger quality and repeat use." },
  { id: "anniversary", label: "Anniversary", note: "Higher signal and more emotional weight." },
  { id: "new-relationship", label: "New", note: "Keep it sharp, simple, and easy to receive." },
];

const budgetOptions = [
  { id: "under-50", label: "Under $50", note: "Fast, practical, low-risk buying lane." },
  { id: "under-100", label: "Under $100", note: "Best all-around range for quality without overpaying." },
  { id: "premium", label: "Premium", note: "More finish, stronger feel, higher spend." },
  { id: "any-price", label: "Open", note: "Leave price loose and prioritize fit first." },
];

const signalOptions = [
  { id: "best-overall", label: "Popular right now", note: "The easiest current answer when you want a safe win." },
  { id: "looks-expensive", label: "Looks expensive", note: "A cleaner premium feel without random luxury." },
  { id: "daily-use", label: "Actually useful", note: "More practical, still gift-worthy, and easier to justify." },
  { id: "cozy-home", label: "Cozy home", note: "Softer, calmer, home-focused gifts." },
];

const intentOptions = [
  { id: "thoughtful", label: "Thoughtful", note: "Feels considered without looking overworked." },
  { id: "looks-expensive", label: "Polished", note: "Stronger visual payoff and cleaner presentation." },
  { id: "everyday", label: "Useful", note: "Built around routine and repeat use." },
  { id: "cozy", label: "Soft", note: "Comfort-first, warmer, more at-home." },
];

const sliderFields = [
  { key: "relationship", label: "Who is it for", options: relationshipOptions },
  { key: "budget", label: "How much", options: budgetOptions },
  { key: "signal", label: "What lane", options: signalOptions },
  { key: "intent", label: "What should it feel like", options: intentOptions },
];

const guideNotes = [
  {
    label: "Birthday",
    title: "Birthday gifts she will actually use",
    body: "Keep it clean, useful, and easy to like at first glance. Do not overbuild the meaning.",
  },
  {
    label: "Anniversary",
    title: "Anniversary gifts with more signal",
    body: "Higher polish, stronger quality, and a clearer sense of occasion without drifting into generic luxury.",
  },
  {
    label: "Under $100",
    title: "Under-$100 gifts that still feel premium",
    body: "This is the sweet spot for visible quality, lower risk, and better hit rate without overspending.",
  },
];

const dateAreaTemplates = [
  { id: "coffee", name: "Coffee stop", type: "Low pressure", description: "Quiet coffee, short sit, easy first move.", vibe: "Easy start", x: 28, y: 34 },
  { id: "wine", name: "Wine bar", type: "Night", description: "Small room, good lighting, stronger signal.", vibe: "Dressier", x: 64, y: 28 },
  { id: "dinner", name: "Dinner spot", type: "Classic", description: "Straight dinner reservation with less guesswork.", vibe: "Safe plan", x: 72, y: 54 },
  { id: "dessert", name: "Dessert stop", type: "Short date", description: "Good when you want something lighter and easier.", vibe: "Short + sweet", x: 42, y: 66 },
  { id: "walk", name: "Walk route", type: "Day", description: "Open-air route with room to talk and keep moving.", vibe: "Casual", x: 18, y: 58 },
  { id: "bookstore", name: "Bookstore", type: "Interest", description: "Clean fallback when she likes slower, quieter spots.", vibe: "Thoughtful", x: 54, y: 44 },
];

function rankGiftMatches(gifts, filters) {
  const exact = gifts.filter(
    (gift) =>
      gift.tabs.includes(filters.tab) &&
      matchesBudget(gift, filters.budget) &&
      gift.relationships.includes(filters.relationship)
  );
  const tabBudget = gifts.filter(
    (gift) => gift.tabs.includes(filters.tab) && matchesBudget(gift, filters.budget)
  );
  const budgetOnly = gifts.filter((gift) => matchesBudget(gift, filters.budget));
  const source = exact.length ? exact : tabBudget.length ? tabBudget : budgetOnly.length ? budgetOnly : gifts;

  return [...source].sort((a, b) => scoreGift(b, filters) - scoreGift(a, filters));
}

export default function App() {
  const touchRef = useRef({ x: 0, y: 0 });
  const [catalog, setCatalog] = useState(() => readLiveCatalog());
  const [activeSlide, setActiveSlide] = useState(0);
  const [savedIds, setSavedIds] = useState(() => loadSaved());
  const [previewGift, setPreviewGift] = useState(null);
  const [geoState, setGeoState] = useState({ status: "idle", label: "Preview area", coords: null });
  const [activeDateSpotId, setActiveDateSpotId] = useState(dateAreaTemplates[0].id);
  const [brief, setBrief] = useState({
    relationship: 1,
    budget: 1,
    signal: 0,
    intent: 0,
  });

  const { affiliateConfig, gifts } = catalog;

  useEffect(() => {
    return subscribeToCatalogUpdates(() => {
      setCatalog(readLiveCatalog());
    });
  }, []);

  const activeRelationship = relationshipOptions[brief.relationship];
  const activeBudget = budgetOptions[brief.budget];
  const activeSignal = signalOptions[brief.signal];
  const activeIntent = intentOptions[brief.intent];

  const activeFilters = useMemo(
    () => ({
      relationship: activeRelationship.id,
      budget: activeBudget.id,
      tab: activeSignal.id,
      intent: activeIntent.id,
      search: "",
    }),
    [activeBudget.id, activeIntent.id, activeRelationship.id, activeSignal.id]
  );

  const rankedMatches = useMemo(() => rankGiftMatches(gifts, activeFilters), [gifts, activeFilters]);
  const topPicks = rankedMatches.slice(0, 6);
  const savedSlideIndex = slides.findIndex((slide) => slide.id === "saved");
  const trendingStories = useMemo(
    () =>
      signalOptions
        .map((option) => {
          const gift = rankGiftMatches(gifts, { ...activeFilters, tab: option.id })[0] || null;
          return gift
            ? {
                ...option,
                gift,
                current: option.id === activeSignal.id,
                rank: rankGiftMatches(gifts, { ...activeFilters, tab: option.id }).findIndex(
                  (item) => item.id === gift.id
                ) + 1,
              }
            : null;
        })
        .filter(Boolean),
    [activeFilters, activeSignal.id, gifts]
  );
  const savedGifts = useMemo(
    () => gifts.filter((gift) => savedIds.includes(gift.id)),
    [gifts, savedIds]
  );
  const guidePicks = useMemo(
    () => rankGiftMatches(gifts, { ...activeFilters, budget: "under-100" }).slice(0, 3),
    [gifts, activeFilters]
  );
  const nearbyDateSpots = useMemo(() => {
    const base = geoState.coords
      ? Math.abs(Math.round(geoState.coords.latitude * 1000) + Math.round(geoState.coords.longitude * 1000))
      : 124;

    return dateAreaTemplates.map((spot, index) => ({
      ...spot,
      distance: `${((base % 5) * 0.2 + 0.3 + index * 0.18).toFixed(1)} mi`,
    }));
  }, [geoState.coords]);
  const activeDateSpot = nearbyDateSpots.find((spot) => spot.id === activeDateSpotId) || nearbyDateSpots[0] || null;
  const videoStories = useMemo(() => {
    const definitions = [
      {
        id: "women",
        label: "For women",
        filters: { relationship: "girlfriend", budget: "under-100", tab: "best-overall", intent: "thoughtful" },
      },
      {
        id: "wives",
        label: "For wives",
        filters: { relationship: "wife", budget: "premium", tab: "looks-expensive", intent: "looks-expensive" },
      },
      {
        id: "girlfriends",
        label: "For girlfriends",
        filters: { relationship: "girlfriend", budget: "under-100", tab: "best-overall", intent: "thoughtful" },
      },
      {
        id: "under-100",
        label: "Under $100",
        filters: { budget: "under-100", tab: "best-overall", intent: "everyday" },
      },
      {
        id: "expensive",
        label: "Looks expensive",
        filters: { tab: "looks-expensive", budget: "premium", intent: "looks-expensive" },
      },
      {
        id: "useful",
        label: "Actually useful",
        filters: { tab: "daily-use", budget: "under-100", intent: "everyday" },
      },
      {
        id: "anniversary",
        label: "Anniversary",
        filters: { relationship: "anniversary", budget: "premium", tab: "looks-expensive", intent: "thoughtful" },
      },
      {
        id: "new-relationship",
        label: "New relationship",
        filters: { relationship: "new-relationship", budget: "under-50", tab: "best-overall", intent: "thoughtful" },
      },
      {
        id: "cozy",
        label: "Cozy home",
        filters: { budget: "under-100", tab: "cozy-home", intent: "cozy" },
      },
      {
        id: "daily-upgrade",
        label: "Daily upgrade",
        filters: { relationship: "wife", budget: "under-100", tab: "daily-use", intent: "everyday" },
      },
    ];

    const usedIds = new Set();

    return definitions
      .map((story, index) => {
        const picks = rankGiftMatches(gifts, { ...activeFilters, ...story.filters });
        const gift = picks.find((candidate) => !usedIds.has(candidate.id)) || picks[0] || gifts[index % gifts.length] || null;

        if (!gift) {
          return null;
        }

        usedIds.add(gift.id);

        return {
          ...story,
          gift,
          views: `${130 + index * 47}k`,
          imageUrl: `https://picsum.photos/seed/${encodeURIComponent(`${gift.id}-${story.id}-video`)}/400/600`,
        };
      })
      .filter(Boolean);
  }, [gifts, activeFilters]);

  function setSlide(index) {
    const nextIndex = Math.max(0, Math.min(slides.length - 1, index));
    setActiveSlide(nextIndex);
  }

  function updateBrief(key, value) {
    setBrief((current) => ({
      ...current,
      [key]: Number(value),
    }));
  }

  function updateSignalById(id) {
    const nextIndex = signalOptions.findIndex((option) => option.id === id);

    if (nextIndex >= 0) {
      updateBrief("signal", nextIndex);
    }
  }

  function toggleSaved(id) {
    setSavedIds((current) => {
      const nextSaved = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      persistSaved(nextSaved);
      return nextSaved;
    });
  }

  function onTouchStart(event) {
    const touch = event.touches[0];
    touchRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event) {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchRef.current.x;
    const deltaY = touch.clientY - touchRef.current.y;

    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      setSlide(activeSlide + 1);
      return;
    }

    setSlide(activeSlide - 1);
  }

  function getGiftImageUrl(gift) {
    return `https://picsum.photos/seed/${encodeURIComponent(gift.id)}/640/480`;
  }

  function openPreview(gift) {
    setPreviewGift(gift);
  }

  function closePreview() {
    setPreviewGift(null);
  }

  function useMyArea() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState({ status: "unsupported", label: "Preview area", coords: null });
      return;
    }

    setGeoState((current) => ({ ...current, status: "loading" }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          status: "ready",
          label: "Near you",
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      () => {
        setGeoState({ status: "denied", label: "Preview area", coords: null });
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 120000,
      }
    );
  }

  function renderBentoCard(gift, index, options = {}) {
    const isSaved = savedIds.includes(gift.id);
    const { eyebrow = gift.badge, deck = gift.hook } = options;

    return (
      <article key={`${gift.id}-bento-${index}`} className="gs-bento-card">
        <div className="gs-bento-image-wrap">
          <img src={getGiftImageUrl(gift)} alt={gift.name} className="gs-bento-image" loading="lazy" />
        </div>
        <div className="gs-bento-content">
          {eyebrow && <p className="gs-overline">{eyebrow}</p>}
          <h3>{gift.name}</h3>
          <p>{deck}</p>
          <div className="gs-bento-footer">
             <div className="gs-product-meta" style={{ marginTop: 0 }}>
               <span>{gift.priceLabel}</span>
             </div>
             <div className="gs-bento-actions">
                <button
                  type="button"
                  className="gs-icon-btn"
                  onClick={() => openPreview(gift)}
                  aria-label={`View ${gift.name}`}
                >
                  <Play />
                </button>
                <button
                  type="button"
                  className={classNames("gs-icon-btn", isSaved && "is-active")}
                  onClick={() => toggleSaved(gift.id)}
                  aria-label={isSaved ? "Remove from saved" : "Save"}
                >
                  {isSaved ? <BookmarkCheck /> : <Bookmark />}
                </button>
                <a 
                  className="gs-icon-btn" 
                  href={buildAffiliateLink(gift)} 
                  target="_blank" 
                  rel="noreferrer"
                  aria-label="Buy"
                >
                  <ArrowUpRight />
                </a>
             </div>
          </div>
        </div>
      </article>
    );
  }

  function renderGiftCard(gift, index, options = {}) {
    const isSaved = savedIds.includes(gift.id);
    const {
      eyebrow = gift.badge,
      deck = gift.hook,
      meta = [gift.priceLabel, gift.bestFor].filter(Boolean),
      primaryLabel = "BUY",
    } = options;

    return (
      <article key={`${gift.id}-${eyebrow}-${index}`} className="gs-product-card">
        <span className="gs-product-rank">/{String(index).padStart(2, "0")}</span>
        <div className="gs-product-main">
          {eyebrow && <p className="gs-overline">{eyebrow}</p>}
          <h3>{gift.name}</h3>
          <p>{deck}</p>
          {meta.length > 0 && (
            <div className="gs-product-meta">
              {meta.map((value) => (
                <span key={`${gift.id}-${value}`}>{value}</span>
              ))}
            </div>
          )}
        </div>
        <div className="gs-product-actions">
          <button type="button" className="gs-secondary-btn" onClick={() => openPreview(gift)}>
            VIEW
          </button>
          <a className="gs-primary-btn" href={buildAffiliateLink(gift)} target="_blank" rel="noreferrer">
            {primaryLabel}
          </a>
          <button
            type="button"
            className={classNames("gs-secondary-btn", isSaved && "is-active")}
            onClick={() => toggleSaved(gift.id)}
          >
            {isSaved ? "SAVED" : "SAVE"}
          </button>
        </div>
      </article>
    );
  }

  function renderSavedRow(gift, index) {
    const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(gift.id)}/200/200`;

    return (
      <article key={`${gift.id}-saved`} className="gs-saved-row">
        <div className="gs-saved-image-wrap">
          <img src={imageUrl} alt={gift.name} className="gs-saved-image" loading="lazy" />
        </div>
        <div className="gs-saved-content">
          <div className="gs-saved-main">
            <h3>{gift.name}</h3>
            <p className="gs-saved-price">{gift.priceLabel}</p>
          </div>
          <div className="gs-saved-actions">
            <a className="gs-primary-btn" href={buildAffiliateLink(gift)} target="_blank" rel="noreferrer">
              BUY NOW
            </a>
            <button
              type="button"
              className="gs-icon-btn is-active"
              onClick={() => toggleSaved(gift.id)}
              aria-label="Remove from saved"
            >
              <BookmarkCheck />
            </button>
          </div>
        </div>
      </article>
    );
  }

  function renderFooter() {
    return (
      <footer className="gs-footer">
        <div className="gs-footer-brand">
          <img src="/logo1.png" alt="ShopForHer" className="gs-footer-img" />
          <p>Fast gift picks for men buying for her.</p>
        </div>
        <div className="gs-footer-meta">
          <p>Affiliate links. We may earn from qualifying purchases.</p>
          <p>Checkout happens on the merchant site. Apple Pay or similar fast checkout appears there when supported.</p>
          <p>Saved picks stay on this device. Updated weekly.</p>
          <a href="mailto:hello@shopforher.org">hello@shopforher.org</a>
        </div>
      </footer>
    );
  }

  return (
    <div className="gs-slider-app">
      <div className="gs-ascii-bg" />
      <div className="gs-phone-frame">
        <header className="gs-header">
          <div className="gs-navbar">
            <a href="/" className="gs-brand" aria-label="ShopForHer home">
              <img src="/logo1.png" alt="ShopForHer" className="gs-logo" />
            </a>
            <nav className="gs-site-nav" aria-label="Primary">
              {editorialSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={classNames("gs-site-link", activeSlide === index && "is-active")}
                  onClick={() => setSlide(index)}
                  aria-current={activeSlide === index ? "page" : undefined}
                >
                  {slide.label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              className={classNames("gs-nav-save", activeSlide === savedSlideIndex && "is-active")}
              onClick={() => setSlide(savedSlideIndex)}
              aria-current={activeSlide === savedSlideIndex ? "page" : undefined}
            >
              Saved
              <span className="gs-nav-save-count">{savedGifts.length}</span>
            </button>
          </div>
        </header>

        <section className="gs-slider-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div
            className="gs-slider-track"
            style={{ transform: `translateX(-${(activeSlide * 100) / slides.length}%)` }}
          >
            <section className="gs-slide">
              <div className="gs-slide-scroll">
                <div className="gs-parallax-copy">
                  <p className="gs-overline">Popular</p>
                  <h2>Gifts to buy right now.</h2>
                  <p>Clean picks for girlfriends and wives.</p>
                </div>

                <section className="gs-product-list">
                  <div className="gs-section-head">
                    <p className="gs-overline">Popular now</p>
                    <h3>Start here</h3>
                  </div>
                  <div className="gs-bento-grid">
                    {topPicks.map((gift, index) =>
                      renderBentoCard(gift, index + 1, {
                        eyebrow: index === 0 ? "Best overall" : gift.badge,
                      })
                    )}
                  </div>
                </section>
                {renderFooter()}
              </div>
            </section>

            <section className="gs-slide">
              <div className="gs-slide-scroll">
                <div className="gs-parallax-copy">
                  <p className="gs-overline">Hot</p>
                  <h2>Hot gift ideas.</h2>
                  <p>Watch. View. Buy.</p>
                </div>

                <section className="gs-tiktok-grid">
                  {videoStories.map((item, index) => {
                    const gift = item.gift;
                    const isTall = index % 3 === 0 || index % 5 === 0;

                    return (
                      <button
                        key={`${gift.id}-tiktok-${index}`} 
                        className={classNames("gs-tiktok-card", isTall && "is-tall")}
                        type="button"
                        onClick={() => openPreview(gift)}
                      >
                        <img src={item.imageUrl} alt={gift.name} className="gs-tiktok-video-thumb" loading="lazy" />
                        <div className="gs-tiktok-overlay">
                          <div className="gs-tiktok-badge">
                            <Play size={12} fill="currentColor" strokeWidth={2} />
                            <span>{item.views}</span>
                          </div>
                          <div className="gs-tiktok-info">
                            <span className="gs-tiktok-category">{item.label}</span>
                            <h3>{gift.name}</h3>
                            <p>{gift.priceLabel}</p>
                            <span className="gs-tiktok-cta">Tap to view</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </section>
                {renderFooter()}
              </div>
            </section>

            <section className="gs-slide">
              <div className="gs-slide-scroll">
                <div className="gs-parallax-copy">
                  <p className="gs-overline">Guides</p>
                  <h2>Date area map.</h2>
                  <p>Simple black and white spots near you.</p>
                </div>

                <section className="gs-map-panel">
                  <div className="gs-map-topbar">
                    <div className="gs-map-location">
                      <p className="gs-overline">Area</p>
                      <strong>{geoState.label}</strong>
                    </div>
                    <button type="button" className="gs-map-locate" onClick={useMyArea}>
                      {geoState.status === "loading" ? "Locating..." : "Use my area"}
                    </button>
                  </div>

                  <div className="gs-map-container gs-topo-map">
                    <svg className="gs-topo-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      <path d="M-5 22C9 15 18 32 31 26s20-18 35-12 20 18 39 10" />
                      <path d="M-4 34c14-8 22 8 34 3s16-16 29-14 21 16 42 9" />
                      <path d="M-6 48c13-6 24 8 37 1s17-18 29-13 20 16 41 8" />
                      <path d="M-2 62c12-6 22 6 33 0s18-16 31-12 20 14 40 8" />
                      <path d="M-1 76c13-7 24 7 36 1s18-15 30-11 20 12 39 7" />
                    </svg>

                    <div className="gs-map-user">
                      <span />
                    </div>

                    {nearbyDateSpots.map((spot) => (
                      <button
                        key={spot.id}
                        type="button"
                        className={classNames("gs-map-pin", activeDateSpot?.id === spot.id && "is-active")}
                        style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
                        onClick={() => setActiveDateSpotId(spot.id)}
                        aria-label={`${spot.name}, ${spot.distance}`}
                      >
                        <MapPin size={14} />
                      </button>
                    ))}

                    <div className="gs-map-label">{geoState.label}</div>
                  </div>

                  {activeDateSpot ? (
                    <article className="gs-map-feature">
                      <p className="gs-overline">{activeDateSpot.type}</p>
                      <h3>{activeDateSpot.name}</h3>
                      <p>{activeDateSpot.description}</p>
                      <div className="gs-map-meta">
                        <span>{activeDateSpot.distance}</span>
                        <span>{activeDateSpot.vibe}</span>
                      </div>
                    </article>
                  ) : null}
                </section>

                <section className="gs-spot-list">
                  {nearbyDateSpots.map((spot) => (
                    <button
                      key={spot.id}
                      type="button"
                      className={classNames("gs-spot-card", activeDateSpot?.id === spot.id && "is-active")}
                      onClick={() => setActiveDateSpotId(spot.id)}
                    >
                      <div className="gs-spot-icon">
                        <MapPin size={18} />
                      </div>
                      <div className="gs-spot-info">
                        <h4>{spot.name}</h4>
                        <p>{spot.description}</p>
                      </div>
                      <div className="gs-spot-meta">
                        <span>{spot.distance}</span>
                      </div>
                    </button>
                  ))}
                </section>
                {renderFooter()}
              </div>
            </section>

            <section className="gs-slide">
              <div className="gs-slide-scroll">
                <div className="gs-parallax-copy">
                  <p className="gs-overline">Saved</p>
                  <h2>Keep only the picks you would actually buy.</h2>
                  <p>Your shortlist.</p>
                </div>

                <section className="gs-stack">
                  <div className="gs-saved-list">
                    {savedGifts.length ? (
                      savedGifts.map((gift, index) => renderSavedRow(gift, index))
                    ) : (
                      <article className="gs-empty-panel">
                        <p>No saved picks yet. Save the cover pick or one of the hot stories and it will live here.</p>
                      </article>
                    )}
                  </div>
                </section>
                {renderFooter()}
              </div>
            </section>
          </div>
        </section>

        {previewGift ? (
          <div className="gs-preview-shell" role="dialog" aria-modal="true" aria-label={`${previewGift.name} quick view`}>
            <button type="button" className="gs-preview-backdrop" onClick={closePreview} aria-label="Close preview" />
            <section className="gs-preview-sheet">
              <div className="gs-preview-media">
                <img src={getGiftImageUrl(previewGift)} alt={previewGift.name} className="gs-preview-image" />
              </div>
              <div className="gs-preview-body">
                <div className="gs-preview-head">
                  <div>
                    <p className="gs-overline">Quick view</p>
                    <h3>{previewGift.name}</h3>
                  </div>
                  <button type="button" className="gs-preview-close" onClick={closePreview}>
                    Close
                  </button>
                </div>
                <p className="gs-preview-copy">{previewGift.hook}</p>
                <div className="gs-preview-meta">
                  <span>{previewGift.badge}</span>
                  <span>{previewGift.priceLabel}</span>
                  <span>{previewGift.bestFor}</span>
                </div>
                <p className="gs-preview-note">
                  Buy on {affiliateConfig.merchantName}. Apple Pay or other fast checkout appears there when supported.
                </p>
                <div className="gs-preview-actions">
                  <a className="gs-primary-btn" href={buildAffiliateLink(previewGift)} target="_blank" rel="noreferrer">
                    BUY NOW
                  </a>
                  <button
                    type="button"
                    className={classNames("gs-secondary-btn", savedIds.includes(previewGift.id) && "is-active")}
                    onClick={() => toggleSaved(previewGift.id)}
                  >
                    {savedIds.includes(previewGift.id) ? "SAVED" : "SAVE"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
