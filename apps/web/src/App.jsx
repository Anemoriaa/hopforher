import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bookmark, BookmarkCheck, MapPin, Play } from "lucide-react";
import { useInView } from "react-intersection-observer";
import Masonry from "react-masonry-css";
import { featuredSeoGuides, seoCatalog, seoDateCities, seoHotStories } from "./content/seo-guides.js";
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
import {
  buildFallbackDateSpots,
  buildOpenTableNearbyUrl,
  DEFAULT_DATE_PARTY_SIZE,
  formatDateTimeSummary,
  getDefaultDateTimeInput,
} from "./lib/date-spots.js";

const slides = [
  { id: "popular", label: "Popular", number: "01" },
  { id: "hot", label: "Hot", number: "02" },
  { id: "guides", label: "Dates", number: "03" },
  { id: "saved", label: "Saved", number: "04" },
];

const editorialSlides = slides.filter((slide) => slide.id !== "saved");
const seoCatalogById = new Map(seoCatalog.map((gift) => [gift.id, gift]));

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

const datePartySizeOptions = Array.from({ length: 8 }, (_, index) => index + 1);
const dateSpotsApiPath = import.meta.env.VITE_DATE_SPOTS_API_PATH || "/api/date-spots";

const hotStoryHeights = [520, 640, 760, 580, 700, 840, 620];

function getStableSeed(...parts) {
  return parts.join("-").split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function buildHotStoryImage(giftId, storyId) {
  const imageHeight = hotStoryHeights[getStableSeed(giftId, storyId) % hotStoryHeights.length];
  return `https://picsum.photos/seed/${encodeURIComponent(`${giftId}-${storyId}-story`)}/480/${imageHeight}`;
}

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
  const initialDateTime = getDefaultDateTimeInput();
  const [catalog, setCatalog] = useState(() => readLiveCatalog());
  const [activeSlide, setActiveSlide] = useState(0);
  const [savedIds, setSavedIds] = useState(() => loadSaved());
  const [previewGift, setPreviewGift] = useState(null);
  const [geoState, setGeoState] = useState({ status: "idle", label: "Preview area", coords: null });
  const [dateSearch, setDateSearch] = useState(() => ({
    partySize: DEFAULT_DATE_PARTY_SIZE,
    dateTime: initialDateTime,
  }));
  const [dateResults, setDateResults] = useState(() => ({
    status: "idle",
    mode: "idle",
    areaLabel: "Preview area",
    note: "Use your location to load nearby OpenTable spots.",
    sourceLabel: "Powered by OpenTable",
    searchUrl: buildOpenTableNearbyUrl({
      partySize: DEFAULT_DATE_PARTY_SIZE,
      dateTime: initialDateTime,
    }),
    spots: [],
  }));
  const [activeDateSpotId, setActiveDateSpotId] = useState(null);
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

    return merged.slice(0, 18);
  }, [gifts, rankedMatches, activeFilters]);
  const linkedTopProducts = useMemo(
    () => topPicks.map((gift) => seoCatalogById.get(gift.id)).filter(Boolean).slice(0, 6),
    [topPicks]
  );
  const popularHeroProducts = linkedTopProducts.slice(0, 3);
  const savedSlideIndex = slides.findIndex((slide) => slide.id === "saved");
  const datesSlideIndex = slides.findIndex((slide) => slide.id === "guides");
  const savedGifts = useMemo(
    () => gifts.filter((gift) => savedIds.includes(gift.id)),
    [gifts, savedIds]
  );
  const activeDateSpot =
    dateResults.spots.find((spot) => spot.id === activeDateSpotId) || dateResults.spots[0] || null;
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
      {
        id: "birthday",
        label: "Birthday",
        heat: "Gift-ready",
        filters: { relationship: "girlfriend", budget: "under-100", tab: "best-overall", intent: "thoughtful" },
      },
      {
        id: "wife-premium",
        label: "Wife premium",
        heat: "Big move",
        filters: { relationship: "wife", budget: "premium", tab: "looks-expensive", intent: "thoughtful" },
      },
      {
        id: "anniversary-under-100",
        label: "Anniversary under $100",
        heat: "Smart spend",
        filters: { relationship: "anniversary", budget: "under-100", tab: "best-overall", intent: "thoughtful" },
      },
      {
        id: "daily-soft",
        label: "Daily soft",
        heat: "Easy home",
        filters: { budget: "under-100", tab: "cozy-home", intent: "everyday" },
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
          imageUrl: buildHotStoryImage(gift.id, story.id),
        };
      })
      .filter(Boolean);
  }, [gifts, activeFilters]);

  useEffect(() => {
    if (activeSlide === datesSlideIndex && geoState.status === "idle") {
      useMyArea();
    }
  }, [activeSlide, datesSlideIndex, geoState.status]);

  useEffect(() => {
    if (!dateResults.spots.length) {
      if (activeDateSpotId !== null) {
        setActiveDateSpotId(null);
      }
      return;
    }

    if (!dateResults.spots.some((spot) => spot.id === activeDateSpotId)) {
      setActiveDateSpotId(dateResults.spots[0].id);
    }
  }, [activeDateSpotId, dateResults.spots]);

  useEffect(() => {
    const latitude = geoState.coords?.latitude ?? null;
    const longitude = geoState.coords?.longitude ?? null;
    const searchUrl = buildOpenTableNearbyUrl({
      latitude,
      longitude,
      partySize: dateSearch.partySize,
      dateTime: dateSearch.dateTime,
    });

    if (latitude === null || longitude === null) {
      const blocked = geoState.status === "denied" || geoState.status === "unsupported";

      setDateResults({
        status: geoState.status === "loading" ? "loading" : blocked ? "ready" : "idle",
        mode: blocked ? "fallback" : "idle",
        areaLabel: geoState.label,
        note:
          geoState.status === "denied"
            ? "Location access is blocked. You can still open OpenTable directly or enable location to rank nearby spots."
            : geoState.status === "unsupported"
              ? "This browser does not expose location, so nearby ranking is unavailable here."
              : geoState.status === "loading"
                ? "Locating you now."
                : "Use your location to load nearby OpenTable spots.",
        sourceLabel: "Powered by OpenTable",
        searchUrl,
        spots: blocked ? buildFallbackDateSpots({ partySize: dateSearch.partySize, dateTime: dateSearch.dateTime }) : [],
      });
      return;
    }

    let cancelled = false;

    async function loadNearbyDates() {
      setDateResults((current) => ({
        ...current,
        status: "loading",
        mode: current.mode,
        areaLabel: geoState.label,
        note: `Searching near you for ${dateSearch.partySize} ${dateSearch.partySize === 1 ? "person" : "people"} at ${formatDateTimeSummary(dateSearch.dateTime)}.`,
        sourceLabel: "Powered by OpenTable",
        searchUrl,
      }));

      try {
        const requestUrl = new URL(dateSpotsApiPath, window.location.origin);
        requestUrl.search = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          partySize: String(dateSearch.partySize),
          dateTime: dateSearch.dateTime,
        }).toString();
        const response = await fetch(
          requestUrl.toString()
        );

        if (!response.ok) {
          throw new Error(`Request failed with ${response.status}`);
        }

        if (!response.headers.get("content-type")?.includes("application/json")) {
          throw new Error("Date spots endpoint did not return JSON");
        }

        const payload = await response.json();

        if (cancelled) {
          return;
        }

        setDateResults({
          status: "ready",
          mode: payload.mode || "live",
          areaLabel: payload.areaLabel || geoState.label,
          note: payload.note || "Nearby results are ready.",
          sourceLabel: payload.sourceLabel || "Powered by OpenTable",
          searchUrl: payload.searchUrl || searchUrl,
          spots: Array.isArray(payload.spots) ? payload.spots : [],
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDateResults({
          status: "error",
          mode: "fallback",
          areaLabel: geoState.label,
          note: "Nearby results could not be loaded. You can still open OpenTable directly or configure the partner endpoint.",
          sourceLabel: "Powered by OpenTable",
          searchUrl,
          spots: buildFallbackDateSpots({
            latitude,
            longitude,
            partySize: dateSearch.partySize,
            dateTime: dateSearch.dateTime,
          }),
        });
      }
    }

    loadNearbyDates();

    return () => {
      cancelled = true;
    };
  }, [dateSearch.dateTime, dateSearch.partySize, geoState.coords, geoState.label, geoState.status]);

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

  function updateDateSearch(key, value) {
    setDateSearch((current) => ({
      ...current,
      [key]: key === "partySize" ? Number(value) : value,
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
      setGeoState({ status: "unsupported", label: "Location unavailable", coords: null });
      return;
    }

    setGeoState((current) => ({ ...current, status: "loading", label: "Locating..." }));

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
        setGeoState({ status: "denied", label: "Location blocked", coords: null });
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 120000,
      }
    );
  }

  function AnimatedBentoCard({ gift, index, options, savedIds, toggleSaved, openPreview }) {
    const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "0px 0px -50px 0px" });
    const isSaved = savedIds.includes(gift.id);
    const { eyebrow = gift.badge, deck = gift.hook } = options;
    const minimalMotion = options.motion === "minimal";
    const delayClass = minimalMotion ? "" : index % 3 === 1 ? "delay-100" : index % 3 === 2 ? "delay-200" : "";

    return (
      <article 
        ref={ref} 
        className={classNames(
          "gs-bento-card",
          minimalMotion && "is-minimal-motion",
          inView && (minimalMotion ? "animate-fade-soft" : "animate-fade-up"),
          delayClass
        )}
      >
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

  function renderBentoCard(gift, index, options = {}) {
    return <AnimatedBentoCard key={`${gift.id}-bento-${index}`} gift={gift} index={index} options={options} savedIds={savedIds} toggleSaved={toggleSaved} openPreview={openPreview} />;
  }

  function AnimatedHotCard({ item, index, openPreview }) {
    const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "0px 0px -100px 0px" });
    const gift = item.gift;
    const delayClass = index % 3 === 1 ? "delay-100" : index % 3 === 2 ? "delay-200" : "";

    return (
      <article
        ref={ref}
        className={classNames(
          "gs-hot-feed-card",
          inView && "animate-fade-up",
          delayClass
        )}
        style={{
          "--story-accent-from": gift.accentFrom,
          "--story-accent-to": gift.accentTo,
        }}
      >
        <button
          type="button"
          className="gs-hot-feed-hit"
          onClick={() => openPreview(gift)}
          aria-label={`View ${gift.name}`}
        >
          <div className="gs-hot-feed-media">
            <img
              src={item.imageUrl || buildHotStoryImage(gift.id, item.id)}
              alt={gift.name}
              className="gs-hot-feed-image"
              loading="lazy"
            />
          </div>
          <div className="gs-hot-feed-body">
            <div className="gs-hot-feed-chip-row">
              <span className="gs-hot-feed-chip">{item.label}</span>
              {item.heat && <span className="gs-hot-feed-chip is-heat">{item.heat}</span>}
            </div>
            <h3>{gift.name}</h3>
            <p>{gift.why || gift.hook}</p>
            <div className="gs-hot-feed-meta">
              <div className="gs-hot-feed-source">
                <span className="gs-hot-feed-source-mark">SF</span>
                <span className="gs-hot-feed-source-label">ShopForHer</span>
              </div>
              <div className="gs-hot-feed-meta-tags">
                <span>{gift.badge}</span>
                <span>{gift.priceLabel}</span>
              </div>
            </div>
          </div>
        </button>
      </article>
    );
  }

  function renderGiftCard(gift, index, options = {}) {    const isSaved = savedIds.includes(gift.id);
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
            <a href="/guides/">Guides</a>
            <a href="/hot/">Hot</a>
            <a href="/dates/">Dates</a>
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
        <span className="gs-trust-chip">Updated weekly</span>
        <span className="gs-trust-chip">Fast merchant checkout</span>
      </section>
    );
  }

  const dateStatusLabel =
    dateResults.status === "loading"
      ? "Loading nearby spots"
      : dateResults.mode === "live"
        ? `${dateResults.spots.length} nearby ${dateResults.spots.length === 1 ? "spot" : "spots"}`
        : dateResults.mode === "fallback"
          ? "Fallback date lanes"
          : "Location needed";

  const datePoweredCopy =
    dateResults.mode === "live"
      ? "Links open on OpenTable and nearby ranking comes from the configured partner feed."
      : "Configure OPENTABLE_DIRECTORY_API_URL and partner credentials to replace the fallback lanes with live nearby OpenTable results.";

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
                <section className="gs-popular-hero">
                  <div className="gs-popular-hero-copy">
                    <p className="gs-overline">Popular</p>
                    <h2>Gifts to buy right now.</h2>
                    <p>Clean picks in {activeBudget.label.toLowerCase()} and {activeSignal.label.toLowerCase()}.</p>
                  </div>
                  <div className="gs-popular-hero-visual" aria-hidden="true">
                    <div className="gs-popular-hero-stack">
                      {popularHeroProducts.map((gift, index) => (
                        <a key={gift.slug} href={`/gift/${gift.slug}/`} className={`gs-popular-hero-card is-layer-${index + 1}`}>
                          <img src={getGiftImageUrl(gift)} alt={gift.name} loading="lazy" />
                        </a>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="gs-product-list">
                  <div className="gs-section-head">
                    <p className="gs-overline">Top picks</p>
                    <h3>Most bought</h3>
                  </div>
                  <div className="gs-bento-grid gs-popular-grid">
                    {topPicks.map((gift, index) =>
                      renderBentoCard(gift, index + 1, {
                        eyebrow: index === 0 ? "Best overall" : "",
                        deck: "",
                        motion: "minimal",
                      })
                    )}
                  </div>
                </section>
                <section className="gs-popular-library" aria-label="Popular page organization">
                  <div className="gs-section-head">
                    <p className="gs-overline">Continue</p>
                    <h3>Browse cleanly from here</h3>
                  </div>
                  <p className="gs-popular-library-note">
                    Open a product page when one pick already looks right. Use a guide when you still need the cleanest lane.
                  </p>
                  <div className="gs-popular-library-grid">
                    <article className="gs-popular-library-panel">
                      <div className="gs-popular-library-head">
                        <span className="gs-overline">Products</span>
                        <strong>Direct product pages</strong>
                        <p>Best when you want the exact item, price range, and merchant path fast.</p>
                      </div>
                      <div className="gs-popular-library-list">
                        {linkedTopProducts.map((gift) => (
                          <a key={gift.slug} href={`/gift/${gift.slug}/`} className="gs-popular-library-link">
                            <div>
                              <span className="gs-seo-guide-eyebrow">{gift.badge}</span>
                              <strong>{gift.name}</strong>
                            </div>
                            <ArrowUpRight size={16} />
                          </a>
                        ))}
                      </div>
                    </article>
                    <article className="gs-popular-library-panel">
                      <div className="gs-popular-library-head">
                        <span className="gs-overline">Guides</span>
                        <strong>Organized gift lanes</strong>
                        <p>Best when you want a tighter shortlist by relationship, budget, or mood before buying.</p>
                      </div>
                      <div className="gs-popular-library-list">
                        {featuredSeoGuides.map((guide) => (
                          <a key={guide.slug} href={`/${guide.slug}/`} className="gs-popular-library-link">
                            <div>
                              <span className="gs-seo-guide-eyebrow">{guide.groupLabel}</span>
                              <strong>{guide.label}</strong>
                            </div>
                            <ArrowUpRight size={16} />
                          </a>
                        ))}
                        <a href="/guides/" className="gs-popular-library-link is-all">
                          <div>
                            <span className="gs-seo-guide-eyebrow">Index</span>
                            <strong>All guides</strong>
                          </div>
                          <ArrowUpRight size={16} />
                        </a>
                      </div>
                    </article>
                  </div>
                  {renderTrustStrip()}
                </section>
                {renderFooter()}
              </div>
            </section>

            <section className="gs-slide">
              <div className="gs-slide-scroll">
                <div className="gs-parallax-copy">
                  <p className="gs-overline">Hot</p>
                  <h2>Moving now.</h2>
                  <p>Open it. Buy fast.</p>
                </div>

                <Masonry
                  breakpointCols={{ default: 2, 360: 1 }}
                  className="gs-masonry-grid"
                  columnClassName="gs-masonry-grid_column"
                >
                  {videoStories.map((item, index) => (
                    <AnimatedHotCard key={`${item.gift.id}-hot-${index}`} item={item} index={index} openPreview={openPreview} />
                  ))}
                </Masonry>
                <section className="gs-seo-guide-section" aria-label="Read full hot pages">
                  <div className="gs-section-head">
                    <p className="gs-overline">Stories</p>
                    <h3>Read the full pages</h3>
                  </div>
                  <div className="gs-seo-guide-list">
                    {seoHotStories.slice(0, 6).map((story) => (
                      <a key={story.slug} href={`/hot/${story.slug}/`} className="gs-seo-guide-link">
                        <div>
                          <span className="gs-seo-guide-eyebrow">{story.trendLabel}</span>
                          <strong>{story.h1}</strong>
                        </div>
                        <ArrowUpRight size={16} />
                      </a>
                    ))}
                    <a href="/hot/" className="gs-seo-guide-link is-all">
                      <div>
                        <span className="gs-seo-guide-eyebrow">Index</span>
                        <strong>All hot pages</strong>
                      </div>
                      <ArrowUpRight size={16} />
                    </a>
                  </div>
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
                      <strong>{dateResults.areaLabel || geoState.label}</strong>
                    </div>
                    <button type="button" className="gs-date-locate" onClick={useMyArea}>
                      {geoState.status === "loading" ? "Locating..." : "Use my area"}
                    </button>
                  </div>

                  <div className="gs-date-search">
                    <label className="gs-date-field">
                      <span>Party</span>
                      <select
                        value={dateSearch.partySize}
                        onChange={(event) => updateDateSearch("partySize", event.target.value)}
                      >
                        {datePartySizeOptions.map((partySize) => (
                          <option key={partySize} value={partySize}>
                            {partySize} {partySize === 1 ? "person" : "people"}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="gs-date-field is-wide">
                      <span>When</span>
                      <input
                        type="datetime-local"
                        value={dateSearch.dateTime}
                        onChange={(event) => updateDateSearch("dateTime", event.target.value)}
                      />
                    </label>
                  </div>

                  <div className={classNames("gs-date-status", dateResults.status === "error" && "is-error")}>
                    <div>
                      <span>{dateStatusLabel}</span>
                      <p>{dateResults.note}</p>
                    </div>
                    <a
                      className="gs-date-status-link"
                      href={dateResults.searchUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open OpenTable
                    </a>
                  </div>

                  {activeDateSpot ? (
                    <article className="gs-date-feature">
                      <div className="gs-date-feature-head">
                        <div>
                          <p className="gs-overline">{activeDateSpot.type}</p>
                          <h3>{activeDateSpot.name}</h3>
                        </div>
                        <span className="gs-date-distance">
                          {activeDateSpot.distanceLabel || activeDateSpot.priceHint || activeDateSpot.sourceLabel}
                        </span>
                      </div>
                      <p className="gs-date-copy">{activeDateSpot.description}</p>
                      <div className="gs-date-meta">
                        {[activeDateSpot.neighborhood, activeDateSpot.cuisine, activeDateSpot.vibe, activeDateSpot.ratingLabel]
                          .filter(Boolean)
                          .map((value) => (
                            <span key={`${activeDateSpot.id}-${value}`}>{value}</span>
                          ))}
                      </div>
                      {activeDateSpot.nextSlots?.length ? (
                        <div className="gs-date-times">
                          {activeDateSpot.nextSlots.map((slot) => (
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
                      ) : (
                        <p className="gs-date-availability">{activeDateSpot.availabilityLabel}</p>
                      )}
                      <div className="gs-date-actions">
                        <a
                          className="gs-date-primary"
                          href={activeDateSpot.bookingUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {activeDateSpot.actionLabel} on OpenTable
                        </a>
                        <a
                          className="gs-date-secondary"
                          href={dateResults.searchUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Nearby search
                        </a>
                      </div>
                    </article>
                  ) : (
                    <article className="gs-date-empty">
                      <strong>Use your area to load nearby spots.</strong>
                      <p>Once location is available, this lane can rank nearby places and hand off to OpenTable.</p>
                    </article>
                  )}

                  {dateResults.spots.length > 0 ? (
                    <section className="gs-date-list">
                      {dateResults.spots.map((spot) => (
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
                                <span>{spot.distanceLabel || spot.priceHint || spot.sourceLabel}</span>
                              </span>
                              <span className="gs-date-row-bottom">
                                {[spot.type, spot.neighborhood, spot.availabilityLabel].filter(Boolean).join(" · ")}
                              </span>
                            </span>
                          </button>
                          <a
                            className="gs-date-row-action"
                            href={spot.bookingUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {spot.actionLabel}
                          </a>
                        </article>
                      ))}
                    </section>
                  ) : null}

                <div className="gs-date-powered">
                  <span>{dateResults.sourceLabel}</span>
                  <p>{datePoweredCopy}</p>
                </div>
                <section className="gs-seo-guide-section" aria-label="Browse date city pages">
                  <div className="gs-section-head">
                    <p className="gs-overline">Cities</p>
                    <h3>Open a city page</h3>
                  </div>
                  <div className="gs-seo-guide-list">
                    {seoDateCities.map((city) => (
                      <a key={city.slug} href={`/dates/${city.slug}/`} className="gs-seo-guide-link">
                        <div>
                          <span className="gs-seo-guide-eyebrow">Date spots</span>
                          <strong>{city.city}</strong>
                        </div>
                        <ArrowUpRight size={16} />
                      </a>
                    ))}
                    <a href="/dates/" className="gs-seo-guide-link is-all">
                      <div>
                        <span className="gs-seo-guide-eyebrow">Index</span>
                        <strong>All date pages</strong>
                      </div>
                      <ArrowUpRight size={16} />
                    </a>
                  </div>
                </section>
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
