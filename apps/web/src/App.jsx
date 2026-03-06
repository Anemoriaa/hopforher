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
  { id: "guides", label: "Dates", number: "03" },
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

const dateSpotTemplates = [
  {
    id: "dinner-room",
    name: "Low-light dinner room",
    type: "Dinner",
    neighborhood: "Near downtown",
    description: "Straight reservation. Strong first answer when you want the night to feel handled.",
    vibe: "Easy confidence",
    slots: ["6:30 PM", "7:15 PM", "8:00 PM"],
    bookingUrl: "https://www.opentable.com/",
  },
  {
    id: "wine-bar",
    name: "Natural wine bar",
    type: "Drinks",
    neighborhood: "10 min away",
    description: "Best for a cleaner, lower-pressure date that still feels intentional.",
    vibe: "Low noise",
    slots: ["6:00 PM", "6:45 PM", "8:15 PM"],
    bookingUrl: "https://www.opentable.com/",
  },
  {
    id: "rooftop",
    name: "Rooftop dinner spot",
    type: "Night out",
    neighborhood: "City center",
    description: "Use this when you want a little more visual payoff without overcomplicating it.",
    vibe: "Looks strong",
    slots: ["7:00 PM", "7:30 PM", "8:30 PM"],
    bookingUrl: "https://www.opentable.com/",
  },
  {
    id: "dessert-bar",
    name: "Dessert and cocktail bar",
    type: "After dinner",
    neighborhood: "Close by",
    description: "Shorter plan. Good when you want something easy to say yes to.",
    vibe: "Short + polished",
    slots: ["8:00 PM", "8:45 PM", "9:15 PM"],
    bookingUrl: "https://www.opentable.com/",
  },
  {
    id: "brunch",
    name: "Weekend brunch room",
    type: "Day date",
    neighborhood: "Uptown",
    description: "Clean daytime option when dinner feels too heavy.",
    vibe: "Easy daytime",
    slots: ["11:00 AM", "11:45 AM", "12:30 PM"],
    bookingUrl: "https://www.opentable.com/",
  },
  {
    id: "quiet-room",
    name: "Quiet neighborhood spot",
    type: "Safe pick",
    neighborhood: "Near you",
    description: "Reliable room, good lighting, easy conversation, less risk.",
    vibe: "Zero drama",
    slots: ["6:15 PM", "7:00 PM", "7:45 PM"],
    bookingUrl: "https://www.opentable.com/",
  },
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
  const [activeDateSpotId, setActiveDateSpotId] = useState(dateSpotTemplates[0].id);
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
  const topPicks = useMemo(() => {
    const byScore = [...gifts].sort((a, b) => scoreGift(b, activeFilters) - scoreGift(a, activeFilters));
    const merged = [...rankedMatches, ...byScore].filter(
      (gift, index, array) => array.findIndex((item) => item.id === gift.id) === index
    );

    return merged.slice(0, 12);
  }, [gifts, rankedMatches, activeFilters]);
  const savedSlideIndex = slides.findIndex((slide) => slide.id === "saved");
  const savedGifts = useMemo(
    () => gifts.filter((gift) => savedIds.includes(gift.id)),
    [gifts, savedIds]
  );
  const nearbyDateSpots = useMemo(() => {
    const base = geoState.coords
      ? Math.abs(Math.round(geoState.coords.latitude * 1000) + Math.round(geoState.coords.longitude * 1000))
      : 124;

    return dateSpotTemplates.map((spot, index) => ({
      ...spot,
      distance: `${((base % 5) * 0.2 + 0.3 + index * 0.18).toFixed(1)} mi`,
      nextSlot: spot.slots[0],
    }));
  }, [geoState.coords]);
  const activeDateSpot = nearbyDateSpots.find((spot) => spot.id === activeDateSpotId) || nearbyDateSpots[0] || null;
  const videoStories = useMemo(() => {
    const definitions = [
      {
        id: "women",
        label: "For women",
        heat: "Rising",
        filters: { relationship: "girlfriend", budget: "under-100", tab: "best-overall", intent: "thoughtful" },
      },
      {
        id: "wives",
        label: "For wives",
        heat: "Most booked",
        filters: { relationship: "wife", budget: "premium", tab: "looks-expensive", intent: "looks-expensive" },
      },
      {
        id: "girlfriends",
        label: "For girlfriends",
        heat: "Easy win",
        filters: { relationship: "girlfriend", budget: "under-100", tab: "best-overall", intent: "thoughtful" },
      },
      {
        id: "under-100",
        label: "Under $100",
        heat: "Under budget",
        filters: { budget: "under-100", tab: "best-overall", intent: "everyday" },
      },
      {
        id: "expensive",
        label: "Looks expensive",
        heat: "Looks strong",
        filters: { tab: "looks-expensive", budget: "premium", intent: "looks-expensive" },
      },
      {
        id: "useful",
        label: "Actually useful",
        heat: "Repeat use",
        filters: { tab: "daily-use", budget: "under-100", intent: "everyday" },
      },
      {
        id: "anniversary",
        label: "Anniversary",
        heat: "Higher signal",
        filters: { relationship: "anniversary", budget: "premium", tab: "looks-expensive", intent: "thoughtful" },
      },
      {
        id: "new-relationship",
        label: "New relationship",
        heat: "Low pressure",
        filters: { relationship: "new-relationship", budget: "under-50", tab: "best-overall", intent: "thoughtful" },
      },
      {
        id: "cozy",
        label: "Cozy home",
        heat: "Soft lane",
        filters: { budget: "under-100", tab: "cozy-home", intent: "cozy" },
      },
      {
        id: "daily-upgrade",
        label: "Daily upgrade",
        heat: "Used daily",
        filters: { relationship: "wife", budget: "under-100", tab: "daily-use", intent: "everyday" },
      },
      {
        id: "wife-under-100",
        label: "Wife under $100",
        heat: "Safe buy",
        filters: { relationship: "wife", budget: "under-100", tab: "best-overall", intent: "everyday" },
      },
      {
        id: "girlfriend-premium",
        label: "Girlfriend premium",
        heat: "Higher spend",
        filters: { relationship: "girlfriend", budget: "premium", tab: "looks-expensive", intent: "thoughtful" },
      },
      {
        id: "under-50",
        label: "Under $50",
        heat: "Quick buy",
        filters: { budget: "under-50", tab: "best-overall", intent: "everyday" },
      },
      {
        id: "thoughtful",
        label: "Thoughtful",
        heat: "Cleaner choice",
        filters: { tab: "best-overall", intent: "thoughtful" },
      },
      {
        id: "polished",
        label: "Polished",
        heat: "Looks better",
        filters: { tab: "looks-expensive", intent: "looks-expensive" },
      },
      {
        id: "soft",
        label: "Soft",
        heat: "Cozy lane",
        filters: { tab: "cozy-home", intent: "cozy" },
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
          {deck ? <p>{deck}</p> : null}
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
          <div className="gs-footer-links">
            <a href="/privacy.html">Privacy</a>
            <a href="/terms.html">Terms</a>
            <a href="/affiliate-disclosure.html">Affiliate</a>
          </div>
          <a href="mailto:hello@shopforher.org">hello@shopforher.org</a>
        </div>
      </footer>
    );
  }

  function renderTrustStrip() {
    return (
      <section className="gs-trust-strip" aria-label="Why ShopForHer works">
        <span className="gs-trust-chip">Strong picks only</span>
        <span className="gs-trust-chip">Updated weekly</span>
        <span className="gs-trust-chip">Fast merchant checkout</span>
      </section>
    );
  }

  return (
    <div className="gs-slider-app">
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
                  <p>Straight picks for girlfriends and wives.</p>
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
                        deck: gift.bestFor || "",
                      })
                    )}
                  </div>
                </section>
                {renderTrustStrip()}
                {renderFooter()}
              </div>
            </section>

            <section className="gs-slide">
              <div className="gs-slide-scroll">
                <div className="gs-parallax-copy">
                  <p className="gs-overline">Hot</p>
                  <h2>What is moving right now.</h2>
                  <p>See it. View it. Buy it.</p>
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
                            <span className="gs-tiktok-heat">{item.heat}</span>
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
                  <p className="gs-overline">Dates</p>
                  <h2>Book a place fast.</h2>
                  <p>Dinner and drinks spots you can book fast.</p>
                </div>

                <section className="gs-date-shell">
                  <div className="gs-date-toolbar">
                    <div className="gs-date-area">
                      <p className="gs-overline">Area</p>
                      <strong>{geoState.label}</strong>
                    </div>
                    <button type="button" className="gs-date-locate" onClick={useMyArea}>
                      {geoState.status === "loading" ? "Locating..." : "Use my area"}
                    </button>
                  </div>

                  {activeDateSpot ? (
                    <article className="gs-date-feature">
                      <div className="gs-date-feature-head">
                        <div>
                          <p className="gs-overline">{activeDateSpot.type}</p>
                          <h3>{activeDateSpot.name}</h3>
                        </div>
                        <span className="gs-date-distance">{activeDateSpot.distance}</span>
                      </div>
                      <p className="gs-date-copy">{activeDateSpot.description}</p>
                      <div className="gs-date-meta">
                        <span>{activeDateSpot.neighborhood}</span>
                        <span>{activeDateSpot.vibe}</span>
                        <span>OpenTable</span>
                      </div>
                      <div className="gs-date-times">
                        {activeDateSpot.slots.map((slot) => (
                          <a
                            key={`${activeDateSpot.id}-${slot}`}
                            className="gs-date-time"
                            href={activeDateSpot.bookingUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {slot}
                          </a>
                        ))}
                      </div>
                    </article>
                  ) : null}

                <section className="gs-date-list">
                  {nearbyDateSpots.map((spot) => (
                    <article key={spot.id} className={classNames("gs-date-row", activeDateSpot?.id === spot.id && "is-active")}>
                      <button
                        type="button"
                        className="gs-date-row-main"
                        onClick={() => setActiveDateSpotId(spot.id)}
                      >
                        <span className="gs-date-row-icon">
                          <MapPin size={16} />
                        </span>
                        <span className="gs-date-row-copy">
                          <span className="gs-date-row-top">
                            <strong>{spot.name}</strong>
                            <span>{spot.distance}</span>
                          </span>
                          <span className="gs-date-row-bottom">
                            {spot.type} · {spot.neighborhood} · {spot.nextSlot}
                          </span>
                        </span>
                      </button>
                      <a
                        className="gs-date-row-action"
                        href={spot.bookingUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Book
                      </a>
                    </article>
                  ))}
                </section>

                <div className="gs-date-powered">
                  <span>Powered by OpenTable path</span>
                  <p>Reservations open on OpenTable. Live inventory can be connected through partner access.</p>
                </div>
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
                  {savedGifts.length ? (
                    <>
                      <section className="gs-saved-helper">
                        <strong>{savedGifts.length} saved right now</strong>
                        <p>Keep the shortlist tight. If one still looks obvious, buy it.</p>
                      </section>
                      <div className="gs-saved-list">
                        {savedGifts.map((gift, index) => renderSavedRow(gift, index))}
                      </div>
                    </>
                  ) : (
                    <div className="gs-saved-list">
                      <article className="gs-empty-panel">
                        <p>No saved picks yet. Save the cover pick or one of the hot stories and it will live here.</p>
                        <div className="gs-empty-actions">
                          <button type="button" className="gs-text-link-btn" onClick={() => setSlide(0)}>
                            Open Popular
                          </button>
                          <button type="button" className="gs-text-link-btn" onClick={() => setSlide(1)}>
                            Open Hot
                          </button>
                          <button type="button" className="gs-text-link-btn" onClick={() => setSlide(2)}>
                            Open Dates
                          </button>
                        </div>
                      </article>
                    </div>
                  )}
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
