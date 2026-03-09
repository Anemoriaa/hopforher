import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Bookmark, BookmarkCheck, MapPin, Pause, Play } from "lucide-react";
import { useInView } from "react-intersection-observer";
import Masonry from "react-masonry-css";
import { featuredSeoGuides, featuredSeoProducts, heroSeoProducts, seoCatalog, seoDateCities, seoHotStories } from "./content/seo-guides.js";
import {
  buildAffiliateLink,
  classNames,
  getBudgetReadout,
  loadSaved,
  matchesBudget,
  persistSaved,
  readLiveCatalog,
  scoreGift,
  stateLabels,
  subscribeToCatalogUpdates,
} from "./lib/catalog.js";
import {
  AMAZON_AFFILIATE_REL,
  AMAZON_ASSOCIATE_DISCLOSURE,
  AMAZON_PAID_LINK_NOTE,
  buildAffiliateDataAttributes,
} from "./lib/affiliate.js";
import {
  DATE_SPOTS_PROVIDER_OPENTABLE,
  DEFAULT_DATE_SPOTS_PROVIDER,
  buildDateSpotSearchUrl,
  buildFallbackDateSpots,
  DEFAULT_DATE_PARTY_SIZE,
  formatDateTimeSummary,
  getDateSpotPoweredLabel,
  getDateSpotSearchLinkLabel,
  getDefaultDateTimeInput,
  resolveDateSpotProvider,
} from "./lib/date-spots.js";

const slides = [
  { id: "popular", label: "Popular", number: "01" },
  { id: "hot", label: "Hot", number: "02" },
  { id: "guides", label: "Dates", number: "03" },
  { id: "saved", label: "Saved/Cart", number: "04" },
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
const previewReelFrameDurationMs = 1500;
const TIKTOK_PLAYER_ORIGIN = "https://www.tiktok.com";

function getStableSeed(...parts) {
  return parts.join("-").split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function getHotStoryHeight(giftId, storyId) {
  return hotStoryHeights[getStableSeed(giftId, storyId) % hotStoryHeights.length];
}

function buildHotStoryImage(giftId, storyId) {
  const imageHeight = getHotStoryHeight(giftId, storyId);
  return `https://picsum.photos/seed/${encodeURIComponent(`${giftId}-${storyId}-story`)}/480/${imageHeight}`;
}

function formatDurationLabel(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "";
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function getGiftImageList(gift) {
  if (!gift) {
    return [];
  }

  return [...new Set([gift.imageUrl || gift.image || "", ...(gift.galleryImages || [])].filter(Boolean))];
}

function extractTikTokVideoId(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const normalized = value.trim();
  const directIdMatch = normalized.match(/^\d{8,}$/);

  if (directIdMatch) {
    return directIdMatch[0];
  }

  const playerMatch = normalized.match(/\/player\/v1\/(\d+)/);

  if (playerMatch) {
    return playerMatch[1];
  }

  const videoMatch = normalized.match(/\/video\/(\d+)/);

  if (videoMatch) {
    return videoMatch[1];
  }

  return "";
}

function buildTikTokPlayerUrl(videoId, options = {}) {
  if (!videoId) {
    return "";
  }

  const url = new URL(`/player/v1/${videoId}`, TIKTOK_PLAYER_ORIGIN);

  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

function postTikTokPlayerMessage(frameWindow, type, value) {
  if (!frameWindow || !type) {
    return;
  }

  frameWindow.postMessage(
    {
      type,
      value,
      "x-tiktok-player": true,
    },
    TIKTOK_PLAYER_ORIGIN
  );
}

function getGiftMotionPoster(gift, fallbackId = "story") {
  const videoPoster = (gift?.shortVideos || []).find((video) => video?.posterUrl)?.posterUrl;

  return videoPoster || "";
}

function getPreviewMediaThumbnailUrl(media) {
  if (!media) {
    return "";
  }

  if (media.kind === "image") {
    return media.imageUrl;
  }

  if (media.kind === "reel") {
    return media.posterUrl || media.frames?.[0] || "";
  }

  return media.posterUrl || "";
}

function getPreviewMediaBadgeLabel(media) {
  if (!media) {
    return "Still";
  }

  if (media.kind === "video") {
    return "Video";
  }

  if (media.kind === "embed") {
    return media.provider === "tiktok" ? "TikTok" : "Embed";
  }

  if (media.kind === "reel") {
    return "Reel";
  }

  return "Still";
}

function buildGiftPreviewMedia(gift) {
  if (!gift) {
    return [];
  }

  const images = getGiftImageList(gift);
  const videos = Array.isArray(gift.shortVideos) ? gift.shortVideos : [];
  const videoItems = videos.map((video, index) => {
    const videoId =
      video.provider === "tiktok"
        ? extractTikTokVideoId(video.id || video.sourceUrl || video.embedUrl || "")
        : "";

    return {
      id: `${gift.id}-${video.id || `video-${index + 1}`}`,
      kind: video.provider === "direct" ? "video" : "embed",
      provider: video.provider,
      title: video.title,
      posterUrl: video.posterUrl || images[0] || "",
      videoUrl: video.videoUrl || "",
      embedUrl:
        video.provider === "tiktok"
          ? buildTikTokPlayerUrl(videoId)
          : video.embedUrl || "",
      videoId,
      sourceUrl: video.sourceUrl || "",
      creatorHandle: video.creatorHandle || "",
      creatorName: video.creatorName || "",
      durationSeconds: video.durationSeconds || 0,
      sourceLabel: video.sourceLabel || (video.provider === "tiktok" ? "TikTok" : "Video"),
    };
  });
  const imageItems = images.map((imageUrl, index) => ({
    id: `${gift.id}-image-${index + 1}`,
    kind: "image",
    imageUrl,
    posterUrl: imageUrl,
    title: `${gift.name} image ${index + 1}`,
  }));

  if (videoItems.length) {
    return [...videoItems, ...imageItems];
  }

  if (images.length > 1) {
    return [
      {
        id: `${gift.id}-reel`,
        kind: "reel",
        title: `${gift.name} reel`,
        posterUrl: images[0],
        frames: images,
        durationSeconds: images.length * 2,
        creatorName: "ShopForHer",
        sourceLabel: "Hot edit",
      },
      ...imageItems,
    ];
  }

  return imageItems;
}

function getPrimaryHotMotionMedia(gift) {
  return buildGiftPreviewMedia(gift).find((media) => media.kind !== "image") || null;
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
  const tabRefs = useRef([]);
  const previewCloseRef = useRef(null);
  const previewVideoRef = useRef(null);
  const previewEmbedRef = useRef(null);
  const initialDateTime = getDefaultDateTimeInput();
  const [catalog, setCatalog] = useState(() => readLiveCatalog());
  const [activeSlide, setActiveSlide] = useState(0);
  const [savedIds, setSavedIds] = useState(() => loadSaved());
  const [previewGift, setPreviewGift] = useState(null);
  const [previewMediaIndex, setPreviewMediaIndex] = useState(0);
  const [previewPlaybackActive, setPreviewPlaybackActive] = useState(false);
  const [previewReelFrameIndex, setPreviewReelFrameIndex] = useState(0);
  const [geoState, setGeoState] = useState({ status: "idle", label: "Preview area", coords: null });
  const [dateSearch, setDateSearch] = useState(() => ({
    partySize: DEFAULT_DATE_PARTY_SIZE,
    dateTime: initialDateTime,
  }));
  const [dateResults, setDateResults] = useState(() => ({
    provider: DEFAULT_DATE_SPOTS_PROVIDER,
    status: "idle",
    mode: "idle",
    areaLabel: "Preview area",
    note: "Use your location to load nearby date spots.",
    sourceLabel: getDateSpotPoweredLabel(DEFAULT_DATE_SPOTS_PROVIDER),
    searchUrl: buildDateSpotSearchUrl({
      partySize: DEFAULT_DATE_PARTY_SIZE,
      dateTime: initialDateTime,
    }, { provider: DEFAULT_DATE_SPOTS_PROVIDER }),
    spots: [],
  }));
  const [activeDateSpotId, setActiveDateSpotId] = useState(null);
  const [brief, setBrief] = useState({
    relationship: 1,
    budget: 1,
    signal: 0,
    intent: 0,
  });
  const previewMediaItems = useMemo(() => buildGiftPreviewMedia(previewGift), [previewGift]);
  const activePreviewMedia = previewMediaItems[previewMediaIndex] || previewMediaItems[0] || null;
  const activePreviewPoster = activePreviewMedia
    ? getPreviewMediaThumbnailUrl(activePreviewMedia) || getGiftImageUrl(previewGift)
    : getGiftImageUrl(previewGift);
  const activePreviewEmbedUrl = useMemo(() => {
    if (activePreviewMedia?.kind !== "embed") {
      return "";
    }

    if (activePreviewMedia.provider !== "tiktok") {
      return activePreviewMedia.embedUrl || "";
    }

    return buildTikTokPlayerUrl(activePreviewMedia.videoId, {
      autoplay: 1,
      controls: 1,
      progress_bar: 1,
      play_button: 1,
      volume_control: 1,
      fullscreen_button: 1,
      timestamp: 1,
      loop: 1,
      music_info: 0,
      description: 0,
      rel: 0,
      native_context_menu: 1,
      closed_caption: 1,
    });
  }, [
    activePreviewMedia?.embedUrl,
    activePreviewMedia?.id,
    activePreviewMedia?.kind,
    activePreviewMedia?.provider,
    activePreviewMedia?.videoId,
  ]);
  const activePreviewReelFrame = activePreviewMedia?.kind === "reel"
    ? activePreviewMedia.frames?.[previewReelFrameIndex] || activePreviewMedia.posterUrl || activePreviewPoster
    : "";
  const activePreviewDurationLabel = formatDurationLabel(activePreviewMedia?.durationSeconds || 0);
  const activePreviewSourceLabel =
    activePreviewMedia?.creatorHandle || activePreviewMedia?.creatorName || activePreviewMedia?.sourceLabel || "ShopForHer";

  const { affiliateConfig, gifts } = catalog;

  useEffect(() => {
    return subscribeToCatalogUpdates(() => {
      setCatalog(readLiveCatalog());
    });
  }, []);

  useEffect(() => {
    if (!previewGift || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closePreview();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      previewCloseRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [previewGift]);

  useEffect(() => {
    if (!activePreviewMedia) {
      setPreviewPlaybackActive(false);
      setPreviewReelFrameIndex(0);
      return;
    }

    setPreviewReelFrameIndex(0);
    setPreviewPlaybackActive(activePreviewMedia.kind !== "image");
  }, [activePreviewMedia?.id]);

  useEffect(() => {
    const video = previewVideoRef.current;

    if (!video || activePreviewMedia?.kind !== "video") {
      return;
    }

    if (!previewPlaybackActive) {
      video.pause();
      return;
    }

    const playPromise = video.play();
    playPromise?.catch(() => {
      setPreviewPlaybackActive(false);
    });
  }, [activePreviewMedia?.id, activePreviewMedia?.kind, previewPlaybackActive]);

  useEffect(() => {
    if (activePreviewMedia?.kind !== "reel" || !previewPlaybackActive || !activePreviewMedia.frames?.length) {
      return undefined;
    }

    const frameCount = activePreviewMedia.frames.length;
    const intervalId = window.setInterval(() => {
      setPreviewReelFrameIndex((current) => (current + 1) % frameCount);
    }, previewReelFrameDurationMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activePreviewMedia, previewPlaybackActive]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const onMessage = (event) => {
      if (event.origin !== TIKTOK_PLAYER_ORIGIN) {
        return;
      }

      if (event.source !== previewEmbedRef.current?.contentWindow) {
        return;
      }

      const data = event.data;

      if (!data || data["x-tiktok-player"] !== true || data.type !== "onStateChange") {
        return;
      }

      if (data.value === 1) {
        setPreviewPlaybackActive(true);
        return;
      }

      if (data.value === 0 || data.value === 2 || data.value === -1) {
        setPreviewPlaybackActive(false);
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (activePreviewMedia?.kind !== "embed" || activePreviewMedia.provider !== "tiktok") {
      return;
    }

    postTikTokPlayerMessage(
      previewEmbedRef.current?.contentWindow,
      previewPlaybackActive ? "play" : "pause"
    );
  }, [
    activePreviewMedia?.id,
    activePreviewMedia?.kind,
    activePreviewMedia?.provider,
    previewPlaybackActive,
  ]);

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
    () =>
      topPicks
        .map((gift) => {
          const seoGift = seoCatalogById.get(gift.id);
          return seoGift ? { ...gift, slug: seoGift.slug } : null;
        })
        .filter(Boolean)
        .slice(0, 6),
    [topPicks]
  );
  const featuredCatalogProducts = useMemo(
    () =>
      featuredSeoProducts
        .map((featuredGift) => gifts.find((gift) => gift.id === featuredGift.id))
        .filter(Boolean),
    [gifts]
  );
  const heroCatalogProducts = useMemo(
    () =>
      heroSeoProducts
        .map((heroGift) => gifts.find((gift) => gift.id === heroGift.id))
        .filter(Boolean),
    [gifts]
  );
  const libraryProducts = useMemo(() => {
    const merged = [...featuredSeoProducts, ...linkedTopProducts].filter(
      (gift, index, array) => array.findIndex((item) => item.id === gift.id) === index
    );

    return merged.slice(0, 10);
  }, [linkedTopProducts]);
  const popularHeroProducts = heroCatalogProducts.length ? heroCatalogProducts : linkedTopProducts.slice(0, 3);
  const savedSlideIndex = slides.findIndex((slide) => slide.id === "saved");
  const datesSlideIndex = slides.findIndex((slide) => slide.id === "guides");
  const savedGifts = useMemo(
    () => gifts.filter((gift) => savedIds.includes(gift.id)),
    [gifts, savedIds]
  );
  const activeDateSpot =
    dateResults.spots.find((spot) => spot.id === activeDateSpotId) || dateResults.spots[0] || null;
  const activeDateProvider = resolveDateSpotProvider(dateResults.provider);
  const activeDateSecondaryUrl =
    activeDateSpot?.mapUrl && activeDateSpot.mapUrl !== activeDateSpot.bookingUrl
      ? activeDateSpot.mapUrl
      : dateResults.searchUrl;
  const activeDateSecondaryLabel =
    activeDateSpot?.mapUrl && activeDateSpot.mapUrl !== activeDateSpot.bookingUrl ? "Open in Maps" : "Nearby search";
  const activeDateMeta = activeDateSpot
    ? [
        activeDateSpot.priceHint,
        activeDateSpot.ratingLabel,
        activeDateProvider === DATE_SPOTS_PROVIDER_OPENTABLE ? activeDateSpot.neighborhood : null,
        activeDateSpot.cuisine,
        activeDateSpot.vibe,
      ].filter(Boolean)
    : [];
  const previewSeoGift = previewGift ? seoCatalogById.get(previewGift.id) || null : null;
  const previewBudgetReadout = previewGift ? getBudgetReadout(previewGift, activeBudget.id) : "";
  const previewRelationshipTags = previewGift
    ? (previewGift.relationships || []).slice(0, 4).map((value) => stateLabels[value] || value)
    : [];
  const previewIntentTags = previewGift
    ? (previewGift.intents || []).slice(0, 4).map((value) => stateLabels[value] || value)
    : [];
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

        const imageCount = getGiftImageList(gift).length;
        const primaryVideo = gift.shortVideos?.[0] || null;
        const durationSeconds = primaryVideo?.durationSeconds || (imageCount > 1 ? imageCount * 2 : 0);

        return {
          ...story,
          gift,
          posterUrl: getGiftMotionPoster(gift, story.id),
          storyCoverUrl: buildHotStoryImage(gift.id, story.id),
          storyHeight: getHotStoryHeight(gift.id, story.id),
          mediaKind: primaryVideo ? (primaryVideo.provider === "direct" ? "video" : "embed") : imageCount > 1 ? "reel" : "image",
          mediaLabel: primaryVideo ? (primaryVideo.provider === "tiktok" ? "TikTok" : "Video") : imageCount > 1 ? "Hot edit" : "Preview",
          sourceLabel:
            primaryVideo?.creatorHandle || primaryVideo?.creatorName || primaryVideo?.sourceLabel || (imageCount > 1 ? "ShopForHer edit" : "ShopForHer"),
          durationLabel: formatDurationLabel(durationSeconds),
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
    const provider = resolveDateSpotProvider(dateResults.provider);
    const searchUrl = buildDateSpotSearchUrl({
      latitude,
      longitude,
      partySize: dateSearch.partySize,
      dateTime: dateSearch.dateTime,
    }, { provider });

    if (latitude === null || longitude === null) {
      const blocked = geoState.status === "denied" || geoState.status === "unsupported";

      setDateResults({
        provider,
        status: geoState.status === "loading" ? "loading" : blocked ? "ready" : "idle",
        mode: blocked ? "fallback" : "idle",
        areaLabel: geoState.label,
        note:
          geoState.status === "denied"
            ? "Location access is blocked. You can still open nearby places in Maps or enable location to rank spots."
            : geoState.status === "unsupported"
              ? "This browser does not expose location, so nearby ranking is unavailable here."
              : geoState.status === "loading"
                ? "Locating you now."
                : "Use your location to load nearby date spots.",
        sourceLabel: getDateSpotPoweredLabel(provider),
        searchUrl,
        spots: blocked
          ? buildFallbackDateSpots(
              { partySize: dateSearch.partySize, dateTime: dateSearch.dateTime },
              { provider }
            )
          : [],
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
        sourceLabel: getDateSpotPoweredLabel(provider),
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

        const nextProvider = resolveDateSpotProvider(payload.provider || provider);

        setDateResults({
          status: "ready",
          provider: nextProvider,
          mode: payload.mode || "live",
          areaLabel: payload.areaLabel || geoState.label,
          note: payload.note || "Nearby results are ready.",
          sourceLabel: payload.sourceLabel || getDateSpotPoweredLabel(nextProvider),
          searchUrl: payload.searchUrl || buildDateSpotSearchUrl({
            latitude,
            longitude,
            partySize: dateSearch.partySize,
            dateTime: dateSearch.dateTime,
          }, { provider: nextProvider }),
          spots: Array.isArray(payload.spots) ? payload.spots : [],
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setDateResults({
          status: "error",
          provider,
          mode: "fallback",
          areaLabel: geoState.label,
          note: "Nearby results could not be loaded. You can still open Maps or configure the live provider.",
          sourceLabel: getDateSpotPoweredLabel(provider),
          searchUrl,
          spots: buildFallbackDateSpots({
            latitude,
            longitude,
            partySize: dateSearch.partySize,
            dateTime: dateSearch.dateTime,
          }, { provider }),
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

  function setTabRef(index, node) {
    tabRefs.current[index] = node;
  }

  function focusSlideTab(index) {
    tabRefs.current[index]?.focus();
  }

  function onTabKeyDown(event, index) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === "Home") {
      setSlide(0);
      focusSlideTab(0);
      return;
    }

    if (event.key === "End") {
      const lastIndex = slides.length - 1;
      setSlide(lastIndex);
      focusSlideTab(lastIndex);
      return;
    }

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + direction + slides.length) % slides.length;
    setSlide(nextIndex);
    focusSlideTab(nextIndex);
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
    return gift?.imageUrl || gift?.image || "/logo1.png";
  }

  function getGiftHeroImageUrl(gift) {
    return getGiftImageList(gift)[0] || getGiftImageUrl(gift);
  }

  function getGiftImageStyleVars(gift) {
    const productShot = gift?.imageLayout === "product";

    return {
      "--gift-image-fit": gift?.imageFit || (productShot ? "contain" : "cover"),
      "--gift-image-position": gift?.imagePosition || "center center",
      "--gift-image-bg": gift?.imageBackground || (productShot ? "#f5f3ee" : "#ececec"),
    };
  }

  function getGiftImageFrameProps(gift, baseClassName) {
    const productShot = gift?.imageLayout === "product";

    return {
      className: classNames(baseClassName, productShot && "is-product-shot"),
      style: getGiftImageStyleVars(gift),
    };
  }

  function getAffiliateAnchorData(gift, placement) {
    const seoGift = seoCatalogById.get(gift.id);

    return buildAffiliateDataAttributes({
      gift,
      placement,
      merchant: affiliateConfig.merchantName,
      slug: seoGift?.slug || "",
    });
  }

  function openPreview(gift) {
    setPreviewMediaIndex(0);
    setPreviewPlaybackActive(true);
    setPreviewReelFrameIndex(0);
    setPreviewGift(gift);
  }

  function closePreview() {
    setPreviewPlaybackActive(false);
    setPreviewReelFrameIndex(0);
    setPreviewMediaIndex(0);
    setPreviewGift(null);
  }

  function selectPreviewMedia(index) {
    setPreviewReelFrameIndex(0);
    setPreviewMediaIndex(index);
  }

  function togglePreviewPlayback() {
    if (!activePreviewMedia || activePreviewMedia.kind === "image") {
      return;
    }

    if (activePreviewMedia.kind === "embed" && activePreviewMedia.provider !== "tiktok") {
      return;
    }

    setPreviewPlaybackActive((current) => !current);
  }

  function getPreviewLeadCopy() {
    if (!previewGift) {
      return "";
    }

    if (activePreviewMedia?.kind === "reel") {
      return `${previewGift.hook} Tap once to play or pause the product reel, then use Buy on ${affiliateConfig.merchantName} as the second click.`;
    }

    if (activePreviewMedia?.kind === "video") {
      return `${previewGift.hook} Watch the clip here first, then use Buy on ${affiliateConfig.merchantName} if the product still looks right.`;
    }

    if (activePreviewMedia?.kind === "embed") {
      return `${previewGift.hook} Tap once to play or pause the TikTok here, then use Buy on ${affiliateConfig.merchantName} as the second click.`;
    }

    return previewGift.hook;
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
    const { eyebrow = gift.badge, deck = gift.hook, imageOnly = false } = options;
    const minimalMotion = options.motion === "minimal";
    const delayClass = minimalMotion ? "" : index % 3 === 1 ? "delay-100" : index % 3 === 2 ? "delay-200" : "";

    return (
      <article 
        ref={ref} 
        role="listitem"
        className={classNames(
          "gs-bento-card",
          imageOnly && "is-image-only",
          minimalMotion && "is-minimal-motion",
          inView && (minimalMotion ? "animate-fade-soft" : "animate-fade-up"),
          delayClass
        )}
      >
        {imageOnly ? (
          <button
            type="button"
            className="gs-bento-image-hit"
            onClick={() => openPreview(gift)}
            aria-label={`Preview ${gift.name}`}
          >
            <div {...getGiftImageFrameProps(gift, "gs-bento-image-wrap")}>
              <img src={getGiftImageUrl(gift)} alt={gift.name} className="gs-bento-image" loading="lazy" />
            </div>
          </button>
        ) : (
          <>
            <div {...getGiftImageFrameProps(gift, "gs-bento-image-wrap")}>
              <img src={getGiftImageUrl(gift)} alt={gift.name} className="gs-bento-image" loading="lazy" />
            </div>
            <div className="gs-bento-content">
              <div className="gs-bento-copy">
                {eyebrow && <p className="gs-overline gs-bento-eyebrow">{eyebrow}</p>}
                <h3>{gift.name}</h3>
                {deck ? <p className="gs-bento-deck">{deck}</p> : null}
              </div>
              <div className="gs-bento-footer">
                 <div className="gs-product-meta" style={{ marginTop: 0 }}>
                   <span>{gift.priceLabel}</span>
                 </div>
                 <div className="gs-bento-actions">
                    <button
                      type="button"
                      className="gs-icon-btn"
                      onClick={() => openPreview(gift)}
                      aria-label={`Preview ${gift.name}`}
                    >
                      <Play />
                    </button>
                    <button
                      type="button"
                      className={classNames("gs-icon-btn", isSaved && "is-active")}
                      onClick={() => toggleSaved(gift.id)}
                      aria-pressed={isSaved}
                      aria-label={isSaved ? `Remove ${gift.name} from saved picks` : `Save ${gift.name}`}
                    >
                      {isSaved ? <BookmarkCheck /> : <Bookmark />}
                    </button>
                    <a
                      className="gs-icon-btn"
                      href={buildAffiliateLink(gift)}
                      target="_blank"
                      rel={AMAZON_AFFILIATE_REL}
                      {...getAffiliateAnchorData(gift, "bento-card-icon")}
                      aria-label={`Buy ${gift.name} on ${affiliateConfig.merchantName}`}
                    >
                      <ArrowUpRight />
                    </a>
                 </div>
              </div>
            </div>
          </>
        )}
      </article>
    );
  }

  function renderBentoCard(gift, index, options = {}) {
    return <AnimatedBentoCard key={`${gift.id}-bento-${index}`} gift={gift} index={index} options={options} savedIds={savedIds} toggleSaved={toggleSaved} openPreview={openPreview} />;
  }

  function HotFeedMedia({ item, gift, inView }) {
    const media = useMemo(() => getPrimaryHotMotionMedia(gift), [gift]);
    const videoRef = useRef(null);
    const embedRef = useRef(null);
    const [reelFrameIndex, setReelFrameIndex] = useState(0);
    const coverUrl = item.posterUrl || item.storyCoverUrl || buildHotStoryImage(gift.id, item.id);
    const storyHeight = item.storyHeight || getHotStoryHeight(gift.id, item.id);
    const feedEmbedUrl = useMemo(() => {
      if (media?.kind !== "embed" || media.provider !== "tiktok") {
        return media?.embedUrl || "";
      }

      return buildTikTokPlayerUrl(media.videoId, {
        autoplay: 1,
        controls: 0,
        progress_bar: 0,
        play_button: 0,
        volume_control: 0,
        fullscreen_button: 0,
        timestamp: 0,
        loop: 1,
        music_info: 0,
        description: 0,
        rel: 0,
        native_context_menu: 0,
        closed_caption: 0,
      });
    }, [media?.embedUrl, media?.id, media?.kind, media?.provider, media?.videoId]);
    const isPlayable = inView && (media?.kind === "video" || media?.kind === "reel" || media?.kind === "embed");

    useEffect(() => {
      setReelFrameIndex(0);
    }, [media?.id]);

    useEffect(() => {
      const video = videoRef.current;

      if (!video || media?.kind !== "video") {
        return;
      }

      if (!inView) {
        video.pause();
        return;
      }

      const playPromise = video.play();
      playPromise?.catch(() => {
        video.pause();
      });
    }, [inView, media?.id, media?.kind]);

    useEffect(() => {
      if (!inView || media?.kind !== "reel" || !media.frames?.length) {
        return undefined;
      }

      const intervalId = window.setInterval(() => {
        setReelFrameIndex((current) => (current + 1) % media.frames.length);
      }, previewReelFrameDurationMs);

      return () => {
        window.clearInterval(intervalId);
      };
    }, [inView, media]);

    function handleEmbedLoad() {
      if (media?.kind !== "embed" || media.provider !== "tiktok") {
        return;
      }

      const frameWindow = embedRef.current?.contentWindow;

      postTikTokPlayerMessage(frameWindow, "mute");
      postTikTokPlayerMessage(frameWindow, "play");
    }

    return (
      <div className="gs-hot-feed-media" style={{ aspectRatio: `480 / ${storyHeight}` }}>
        <img
          src={coverUrl}
          alt={gift.name}
          className="gs-hot-feed-image"
          loading="lazy"
        />
        {media?.kind === "video" && inView ? (
          <video
            ref={videoRef}
            src={media.videoUrl}
            poster={media.posterUrl || coverUrl}
            className="gs-hot-feed-video"
            playsInline
            muted
            loop
            preload="metadata"
          />
        ) : media?.kind === "embed" && inView && feedEmbedUrl ? (
          <iframe
            key={media.id}
            ref={embedRef}
            src={feedEmbedUrl}
            title={media.title || `${gift.name} TikTok video`}
            className="gs-hot-feed-embed"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            loading="lazy"
            onLoad={handleEmbedLoad}
          />
        ) : media?.kind === "reel" && inView ? (
          <img
            src={media.frames?.[reelFrameIndex] || media.posterUrl || coverUrl}
            alt={gift.name}
            className="gs-hot-feed-motion-image"
            loading="lazy"
          />
        ) : null}

        {(item.mediaLabel || item.durationLabel || isPlayable) ? (
          <div className="gs-hot-feed-media-badges" aria-hidden="true">
            <span className="gs-hot-feed-floating-chip">
              <Play size={12} />
              <span>{isPlayable ? "Playing" : media?.kind === "image" ? "View" : "Watch"}</span>
            </span>
            {item.mediaLabel ? <span className="gs-hot-feed-floating-chip">{item.mediaLabel}</span> : null}
            {item.durationLabel ? <span className="gs-hot-feed-floating-chip">{item.durationLabel}</span> : null}
          </div>
        ) : null}
      </div>
    );
  }

  function AnimatedHotCard({ item, index, openPreview }) {
    const { ref, inView } = useInView({ triggerOnce: false, rootMargin: "0px 0px -100px 0px" });
    const [hasEntered, setHasEntered] = useState(false);
    const gift = item.gift;
    const delayClass = index % 3 === 1 ? "delay-100" : index % 3 === 2 ? "delay-200" : "";

    useEffect(() => {
      if (inView) {
        setHasEntered(true);
      }
    }, [inView]);

    return (
      <article
        ref={ref}
        role="listitem"
        className={classNames(
          "gs-hot-feed-card",
          hasEntered && "animate-fade-up",
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
          <HotFeedMedia item={item} gift={gift} inView={inView} />
          <div className="gs-hot-feed-body">
            <div className="gs-hot-feed-chip-row">
              <span className="gs-hot-feed-chip">{item.label}</span>
              {item.heat && <span className="gs-hot-feed-chip is-heat">{item.heat}</span>}
            </div>
            <h3>{gift.name}</h3>
            <p>{gift.why || gift.hook}</p>
            <div className="gs-hot-feed-meta">
              <div className="gs-hot-feed-source">
                <span className="gs-hot-feed-source-mark">{item.mediaLabel === "TikTok" ? "TT" : "SF"}</span>
                <span className="gs-hot-feed-source-label">{item.sourceLabel}</span>
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

  function renderGiftCard(gift, index, options = {}) {
    const isSaved = savedIds.includes(gift.id);
    const {
      eyebrow = gift.badge,
      deck = gift.hook,
      meta = [gift.priceLabel, gift.bestFor].filter(Boolean),
      primaryLabel = "BUY",
    } = options;

    return (
      <article key={`${gift.id}-${eyebrow}-${index}`} className="gs-product-card" role="listitem">
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
            <span className="gs-visually-hidden">{`Preview ${gift.name}. `}</span>
            VIEW
          </button>
          <a
            className="gs-primary-btn"
            href={buildAffiliateLink(gift)}
            target="_blank"
            rel={AMAZON_AFFILIATE_REL}
            {...getAffiliateAnchorData(gift, "product-card-primary")}
            aria-label={`Buy ${gift.name} on ${affiliateConfig.merchantName}`}
          >
            {primaryLabel}
          </a>
          <button
            type="button"
            className={classNames("gs-secondary-btn", isSaved && "is-active")}
            onClick={() => toggleSaved(gift.id)}
            aria-pressed={isSaved}
            aria-label={isSaved ? `Remove ${gift.name} from saved picks` : `Save ${gift.name}`}
          >
            {isSaved ? "SAVED" : "SAVE"}
          </button>
        </div>
      </article>
    );
  }

  function renderSavedRow(gift, index) {
    const imageUrl = getGiftImageUrl(gift);

    return (
      <article key={`${gift.id}-saved`} className="gs-saved-row" role="listitem">
        <div {...getGiftImageFrameProps(gift, "gs-saved-image-wrap")}>
          <img src={imageUrl} alt={gift.name} className="gs-saved-image" loading="lazy" />
        </div>
        <div className="gs-saved-content">
          <div className="gs-saved-main">
            <h3>{gift.name}</h3>
            <p className="gs-saved-price">{gift.priceLabel}</p>
          </div>
          <div className="gs-saved-actions">
            <a
              className="gs-primary-btn"
              href={buildAffiliateLink(gift)}
              target="_blank"
              rel={AMAZON_AFFILIATE_REL}
              {...getAffiliateAnchorData(gift, "saved-row-primary")}
            >
              <span className="gs-visually-hidden">{`Buy ${gift.name} on ${affiliateConfig.merchantName}. `}</span>
              BUY NOW
            </a>
            <button
              type="button"
              className="gs-icon-btn is-active"
              onClick={() => toggleSaved(gift.id)}
              aria-pressed={true}
              aria-label={`Remove ${gift.name} from saved picks`}
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
          <p className="gs-footer-disclosure">{AMAZON_ASSOCIATE_DISCLOSURE}</p>
          <p>Paid Amazon links may appear on gift pages. Checkout happens on the merchant site, where final pricing and fast-pay options are controlled.</p>
          <p>Saved picks stay on this device. Updated weekly.</p>
          <div className="gs-footer-links">
            <a href="/about.html">About</a>
            <a href="/editorial-policy.html">Editorial</a>
            <a href="/contact.html">Contact</a>
            <a href="/site-map.html">Site map</a>
            <a href="/feed.xml">Feed</a>
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
        <span className="gs-trust-chip">Amazon paid links disclosed</span>
        <span className="gs-trust-chip">Fast merchant checkout</span>
      </section>
    );
  }

  const dateStatusLabel =
    dateResults.status === "loading"
      ? "Loading nearby spots"
      : dateResults.mode === "live"
        ? `${dateResults.spots.length} nearby ${dateResults.spots.length === 1 ? "spot" : "spots"}`
        : dateResults.mode === "unconfigured"
          ? "Provider not configured"
        : dateResults.mode === "fallback"
          ? "Fallback date lanes"
          : "Location needed";

  const datePoweredCopy =
    dateResults.mode === "live"
      ? activeDateProvider === DATE_SPOTS_PROVIDER_OPENTABLE
        ? "Links open on OpenTable and nearby ranking comes from the configured partner feed."
        : "Nearby ranking comes from Google Places. Actions open the venue site when available, otherwise Google Maps."
      : activeDateProvider === DATE_SPOTS_PROVIDER_OPENTABLE
        ? dateResults.mode === "unconfigured"
          ? "Configure OPENTABLE_DIRECTORY_API_URL and partner credentials in Cloudflare Pages, then redeploy."
          : dateResults.mode === "fallback" || dateResults.status === "error"
            ? "OpenTable did not return live nearby results. Retry, redeploy after env changes, or check the Pages function logs."
            : "Enable location to rank nearby OpenTable spots instead of showing the fallback lane."
        : dateResults.mode === "unconfigured"
          ? "GOOGLE_PLACES_API_KEY is not available to the Pages function. Add it in Cloudflare Pages and redeploy."
          : dateResults.mode === "fallback" || dateResults.status === "error"
            ? "Google Places did not return live nearby results. Retry, redeploy after env changes, or check the Pages function logs."
            : "Enable location to rank nearby Google Places spots instead of showing the fallback lane.";

  function getDateSpotSummaryLabel(spot) {
    return [spot.distanceLabel, spot.priceHint].filter(Boolean).join(" · ") || spot.sourceLabel;
  }

  function getDateRowSummary(spot) {
    const leadMeta =
      activeDateProvider === DATE_SPOTS_PROVIDER_OPENTABLE
        ? [spot.type, spot.neighborhood, spot.ratingLabel]
        : [spot.type, spot.ratingLabel];

    return [...leadMeta, spot.availabilityLabel].filter(Boolean).join(" · ");
  }

  return (
    <div className="gs-slider-app">
      <div className="gs-phone-frame">
        <header className="gs-header">
          <div className="gs-navbar">
            <a href="/" className="gs-brand" aria-label="ShopForHer home">
              <img src="/logo1.png" alt="ShopForHer" className="gs-logo" />
            </a>
            <nav className="gs-site-nav-wrap" aria-label="Primary">
              <div className="gs-site-nav" role="tablist" aria-label="Gift pages">
                {editorialSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    ref={(node) => setTabRef(index, node)}
                    id={`tab-${slide.id}`}
                    role="tab"
                    type="button"
                    className={classNames("gs-site-link", activeSlide === index && "is-active")}
                    onClick={() => setSlide(index)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                    aria-selected={activeSlide === index}
                    aria-controls={`panel-${slide.id}`}
                    tabIndex={activeSlide === index ? 0 : -1}
                  >
                    {slide.label}
                  </button>
                ))}
                <button
                  ref={(node) => setTabRef(savedSlideIndex, node)}
                  id="tab-saved"
                  role="tab"
                  type="button"
                  className={classNames("gs-nav-save", activeSlide === savedSlideIndex && "is-active")}
                  onClick={() => setSlide(savedSlideIndex)}
                  onKeyDown={(event) => onTabKeyDown(event, savedSlideIndex)}
                  aria-selected={activeSlide === savedSlideIndex}
                  aria-controls="panel-saved"
                  tabIndex={activeSlide === savedSlideIndex ? 0 : -1}
                >
                  Saved
                  <span className="gs-nav-save-count" aria-live="polite" aria-atomic="true">
                    <span className="gs-visually-hidden">Saved cart picks count: </span>
                    {savedGifts.length}
                  </span>
                </button>
              </div>
            </nav>
          </div>
        </header>

        <main className="gs-main" id="gs-main-content">
        <section className="gs-slider-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div
            className="gs-slider-track"
            style={{ transform: `translateX(-${(activeSlide * 100) / slides.length}%)` }}
          >
            <section
              id="panel-popular"
              className="gs-slide"
              role="tabpanel"
              aria-labelledby="tab-popular"
              aria-hidden={activeSlide !== 0}
              tabIndex={activeSlide === 0 ? 0 : -1}
            >
              <div className="gs-slide-scroll">
                <section className="gs-popular-hero">
                  <div className="gs-popular-hero-copy">
                    <p className="gs-overline">Popular</p>
                    <h2>Gifts to buy right now.</h2>
                    <p>Clean picks in {activeBudget.label.toLowerCase()} and {activeSignal.label.toLowerCase()}.</p>
                    <button
                      type="button"
                      className="gs-popular-next-indicator"
                      onClick={() => setSlide(1)}
                      aria-label="Open the Hot page"
                    >
                      <span>Scroll right for Hot</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="gs-popular-hero-visual">
                    <div className="gs-popular-hero-stack" aria-hidden="true">
                      {popularHeroProducts.map((gift, index) => (
                        <a
                          key={gift.slug}
                          href={buildAffiliateLink(gift)}
                          target="_blank"
                          rel={AMAZON_AFFILIATE_REL}
                          {...getAffiliateAnchorData(gift, `popular-hero-card-${index + 1}`)}
                          aria-label={`Buy ${gift.name} on ${affiliateConfig.merchantName}`}
                          {...getGiftImageFrameProps(gift, `gs-popular-hero-card is-layer-${index + 1}`)}
                        >
                          <img src={getGiftHeroImageUrl(gift)} alt={gift.name} loading="lazy" />
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
                  <div className="gs-bento-grid gs-popular-grid" role="list" aria-label="Most bought gifts">
                    {topPicks.map((gift, index) =>
                      renderBentoCard(gift, index + 1, {
                        motion: "minimal",
                        imageOnly: true,
                      })
                    )}
                  </div>
                </section>
                <section className="gs-product-list">
                  <div className="gs-section-head">
                    <p className="gs-overline">Amazon</p>
                    <h3>New exact-product picks</h3>
                  </div>
                  <p className="gs-popular-library-note">
                    New Amazon product pages added directly into the catalog so people can open the exact item fast.
                  </p>
                  <div className="gs-bento-grid gs-popular-grid" role="list" aria-label="New exact product picks">
                    {featuredCatalogProducts.map((gift, index) =>
                      renderBentoCard(gift, topPicks.length + index + 1, {
                        motion: "minimal",
                        imageOnly: true,
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
                        {libraryProducts.map((gift) => (
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

            <section
              id="panel-hot"
              className="gs-slide"
              role="tabpanel"
              aria-labelledby="tab-hot"
              aria-hidden={activeSlide !== 1}
              tabIndex={activeSlide === 1 ? 0 : -1}
            >
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
                  role="list"
                  aria-label="Hot gift stories"
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

            <section
              id="panel-guides"
              className="gs-slide"
              role="tabpanel"
              aria-labelledby="tab-guides"
              aria-hidden={activeSlide !== 2}
              tabIndex={activeSlide === 2 ? 0 : -1}
            >
              <div className="gs-slide-scroll">
                <div className="gs-parallax-copy">
                  <p className="gs-overline">Dates</p>
                  <h2>Find a place fast.</h2>
                  <p>Nearby dinner and drinks spots that open in Maps or on the venue site.</p>
                </div>

                <section className="gs-date-shell">
                  <div className="gs-date-toolbar">
                    <div className="gs-date-area">
                      <p className="gs-overline">Area</p>
                      <strong>{dateResults.areaLabel || geoState.label}</strong>
                    </div>
                    <button
                      type="button"
                      className="gs-date-locate"
                      onClick={useMyArea}
                      aria-label="Use my current location to rank nearby date spots"
                    >
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

                  <div
                    className={classNames("gs-date-status", dateResults.status === "error" && "is-error")}
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <div>
                      <span>{dateStatusLabel}</span>
                      <p>{dateResults.note}</p>
                    </div>
                    <a
                      className="gs-date-status-link"
                      href={dateResults.searchUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${getDateSpotSearchLinkLabel(activeDateProvider)} for ${dateResults.areaLabel || "your area"}`}
                    >
                      {getDateSpotSearchLinkLabel(activeDateProvider)}
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
                          {getDateSpotSummaryLabel(activeDateSpot)}
                        </span>
                      </div>
                      <p className="gs-date-copy">{activeDateSpot.description}</p>
                      {activeDateMeta.length ? (
                        <div className="gs-date-meta">
                          {activeDateMeta.map((value) => (
                            <span key={`${activeDateSpot.id}-${value}`}>{value}</span>
                          ))}
                        </div>
                      ) : null}
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
                          aria-label={`${activeDateSpot.actionLabel} for ${activeDateSpot.name}`}
                        >
                          {activeDateSpot.actionLabel}
                        </a>
                        <a
                          className="gs-date-secondary"
                          href={activeDateSecondaryUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`${activeDateSecondaryLabel} for ${activeDateSpot.name}`}
                        >
                          {activeDateSecondaryLabel}
                        </a>
                      </div>
                    </article>
                  ) : (
                    <article className="gs-date-empty">
                      <strong>Use your area to load nearby spots.</strong>
                      <p>Once location is available, this lane can rank nearby places and hand off to Maps or the venue site.</p>
                    </article>
                  )}

                  {dateResults.spots.length > 0 ? (
                    <section className="gs-date-list" role="list" aria-label="Nearby date spots">
                      {dateResults.spots.map((spot) => (
                        <article
                          key={spot.id}
                          role="listitem"
                          className={classNames("gs-date-row", activeDateSpot?.id === spot.id && "is-active")}
                        >
                          <button
                            type="button"
                            className="gs-date-row-main"
                            onClick={() => setActiveDateSpotId(spot.id)}
                            aria-pressed={activeDateSpot?.id === spot.id}
                            aria-label={`Show details for ${spot.name}`}
                          >
                            <span className="gs-date-row-icon">
                              <MapPin size={16} />
                            </span>
                            <span className="gs-date-row-copy">
                              <span className="gs-date-row-top">
                                <strong>{spot.name}</strong>
                                <span>{getDateSpotSummaryLabel(spot)}</span>
                              </span>
                              <span className="gs-date-row-bottom">
                                {getDateRowSummary(spot)}
                              </span>
                            </span>
                          </button>
                          <a
                            className="gs-date-row-action"
                            href={spot.bookingUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`${spot.actionLabel} for ${spot.name}`}
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

            <section
              id="panel-saved"
              className="gs-slide"
              role="tabpanel"
              aria-labelledby="tab-saved"
              aria-hidden={activeSlide !== savedSlideIndex}
              tabIndex={activeSlide === savedSlideIndex ? 0 : -1}
            >
              <div className="gs-slide-scroll">
                <div className="gs-parallax-copy">
                  <p className="gs-overline">Saved/Cart</p>
                  <h2>Keep the gifts you are actually close to buying.</h2>
                  <p>Your local shortlist with a cart-like feel.</p>
                </div>

                <section className="gs-stack">
                  {savedGifts.length ? (
                    <>
                      <section className="gs-saved-helper" role="status" aria-live="polite" aria-atomic="true">
                        <strong>{savedGifts.length} in your saved cart right now</strong>
                        <p>Keep it tight. If one still feels obvious, open it and finish the buy.</p>
                      </section>
                      <div className="gs-saved-list" role="list" aria-label="Saved cart gift picks">
                        {savedGifts.map((gift, index) => renderSavedRow(gift, index))}
                      </div>
                    </>
                  ) : (
                    <div className="gs-saved-list" role="status" aria-live="polite" aria-atomic="true">
                      <article className="gs-empty-panel">
                        <p>No saved picks yet. Save the cover pick or one of the hot stories and it will collect here like a lightweight cart.</p>
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
        </main>

        {previewGift ? (
          <div
            className="gs-preview-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`preview-title-${previewGift.id}`}
            aria-describedby={`preview-description-${previewGift.id}`}
          >
            <button type="button" className="gs-preview-backdrop" onClick={closePreview} aria-label="Close preview" />
            <section
              className="gs-preview-sheet"
              style={{
                "--preview-accent-from": previewGift.accentFrom,
                "--preview-accent-to": previewGift.accentTo,
              }}
            >
              <div className="gs-preview-media">
                <div
                  {...getGiftImageFrameProps(
                    previewGift,
                    classNames("gs-preview-media-frame", activePreviewMedia?.kind !== "image" && "is-motion-frame")
                  )}
                >
                  {activePreviewMedia?.kind === "video" ? (
                    <div className="gs-preview-media-stage is-video">
                      <video
                        key={activePreviewMedia.id}
                        ref={previewVideoRef}
                        src={activePreviewMedia.videoUrl}
                        poster={activePreviewPoster}
                        className="gs-preview-video"
                        playsInline
                        muted
                        loop
                        preload="metadata"
                      />
                      <button
                        type="button"
                        className="gs-preview-play-toggle"
                        onClick={togglePreviewPlayback}
                        aria-pressed={previewPlaybackActive}
                        aria-label={`${previewPlaybackActive ? "Pause" : "Play"} the ${previewGift.name} video`}
                      >
                        {previewPlaybackActive ? <Pause size={16} /> : <Play size={16} />}
                        <span>{previewPlaybackActive ? "Pause" : "Play"}</span>
                      </button>
                    </div>
                  ) : activePreviewMedia?.kind === "embed" && activePreviewEmbedUrl ? (
                    <div className="gs-preview-media-stage is-embed">
                      <iframe
                        key={activePreviewMedia.id}
                        ref={previewEmbedRef}
                        src={activePreviewEmbedUrl}
                        title={activePreviewMedia.title || `${previewGift.name} video`}
                        className="gs-preview-embed"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        allowFullScreen
                        onLoad={() => {
                          if (activePreviewMedia.provider !== "tiktok") {
                            return;
                          }

                          const frameWindow = previewEmbedRef.current?.contentWindow;

                          postTikTokPlayerMessage(frameWindow, "mute");
                          postTikTokPlayerMessage(frameWindow, previewPlaybackActive ? "play" : "pause");
                        }}
                      />
                      {activePreviewMedia.provider === "tiktok" ? (
                        <button
                          type="button"
                          className="gs-preview-play-toggle is-embed-control"
                          onClick={togglePreviewPlayback}
                          aria-pressed={previewPlaybackActive}
                          aria-label={`${previewPlaybackActive ? "Pause" : "Play"} the ${previewGift.name} TikTok`}
                        >
                          {previewPlaybackActive ? <Pause size={16} /> : <Play size={16} />}
                          <span>{previewPlaybackActive ? "Pause" : "Play"}</span>
                        </button>
                      ) : null}
                    </div>
                  ) : activePreviewMedia?.kind === "embed" ? (
                    <div className="gs-preview-media-stage gs-preview-embed-fallback">
                      <p>Open the source clip in a new tab.</p>
                      {activePreviewMedia.sourceUrl ? (
                        <a
                          className="gs-primary-btn gs-preview-source-btn"
                          href={activePreviewMedia.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open source clip
                        </a>
                      ) : null}
                    </div>
                  ) : activePreviewMedia?.kind === "reel" ? (
                    <button
                      type="button"
                      className="gs-preview-media-stage gs-preview-reel-stage"
                      onClick={togglePreviewPlayback}
                      aria-pressed={previewPlaybackActive}
                      aria-label={`${previewPlaybackActive ? "Pause" : "Play"} the ${previewGift.name} reel`}
                    >
                      <img
                        src={activePreviewReelFrame || activePreviewPoster || getGiftImageUrl(previewGift)}
                        alt={previewGift.name}
                        className="gs-preview-image"
                      />
                      <span className="gs-preview-reel-scrim" aria-hidden="true" />
                      <span className="gs-preview-reel-chip">{activePreviewMedia.sourceLabel}</span>
                      {activePreviewMedia.frames?.length > 1 ? (
                        <span className="gs-preview-reel-progress" aria-hidden="true">
                          {activePreviewMedia.frames.map((frame, index) => (
                            <span
                              key={`${activePreviewMedia.id}-${frame}`}
                              className={classNames("gs-preview-reel-dot", index === previewReelFrameIndex && "is-active")}
                            />
                          ))}
                        </span>
                      ) : null}
                      <span className="gs-preview-play-toggle is-inline">
                        {previewPlaybackActive ? <Pause size={16} /> : <Play size={16} />}
                        <span>{previewPlaybackActive ? "Pause" : "Play"}</span>
                      </span>
                    </button>
                  ) : (
                    <img
                      src={activePreviewPoster || getGiftImageUrl(previewGift)}
                      alt={previewGift.name}
                      className="gs-preview-image"
                    />
                  )}
                </div>
                {previewMediaItems.length > 1 ? (
                  <div className="gs-preview-gallery" aria-label={`${previewGift.name} media`}>
                    {previewMediaItems.map((media, index) => (
                      <button
                        key={media.id}
                        type="button"
                        className={classNames(
                          "gs-preview-thumb",
                          previewGift.imageLayout === "product" && "is-product-shot",
                          index === previewMediaIndex && "is-active",
                          media.kind !== "image" && "is-motion-thumb"
                        )}
                        style={getGiftImageStyleVars(previewGift)}
                        onClick={() => selectPreviewMedia(index)}
                        aria-pressed={index === previewMediaIndex}
                        aria-label={`View ${getPreviewMediaBadgeLabel(media).toLowerCase()} ${index + 1} of ${previewMediaItems.length} for ${previewGift.name}`}
                      >
                        <img
                          src={getPreviewMediaThumbnailUrl(media) || getGiftImageUrl(previewGift)}
                          alt=""
                          className="gs-preview-thumb-image"
                        />
                        <span className="gs-preview-thumb-label">{getPreviewMediaBadgeLabel(media)}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="gs-preview-media-bar">
                  {[getPreviewMediaBadgeLabel(activePreviewMedia), activePreviewSourceLabel, activePreviewDurationLabel || previewGift.priceLabel, previewBudgetReadout]
                    .filter(Boolean)
                    .map((value) => (
                      <span key={`${previewGift.id}-${value}`}>{value}</span>
                    ))}
                </div>
              </div>
              <div className="gs-preview-body">
                <div className="gs-preview-head">
                  <div className="gs-preview-head-copy">
                    <p className="gs-overline">{activePreviewMedia?.kind === "image" ? "Quick buy" : "Watch first"}</p>
                    <h3 id={`preview-title-${previewGift.id}`}>{previewGift.name}</h3>
                    <p className="gs-preview-copy" id={`preview-description-${previewGift.id}`}>{getPreviewLeadCopy()}</p>
                  </div>
                  <div className="gs-preview-head-actions">
                    {activePreviewMedia?.sourceUrl ? (
                      <a
                        className="gs-preview-inline-link"
                        href={activePreviewMedia.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open the source clip for ${previewGift.name}`}
                      >
                        Open source
                      </a>
                    ) : null}
                    {previewSeoGift ? (
                      <a
                        className="gs-preview-inline-link"
                        href={`/gift/${previewSeoGift.slug}/`}
                        aria-label={`Open the full page for ${previewGift.name}`}
                      >
                        Open full page
                      </a>
                    ) : null}
                    <button
                      ref={previewCloseRef}
                      type="button"
                      className="gs-preview-close"
                      onClick={closePreview}
                      aria-label={`Close preview for ${previewGift.name}`}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="gs-preview-stat-row">
                  <article className="gs-preview-stat">
                    <span className="gs-preview-label">Price</span>
                    <strong>{previewGift.priceLabel}</strong>
                  </article>
                  <article className="gs-preview-stat">
                    <span className="gs-preview-label">Best for</span>
                    <strong>{previewGift.bestFor}</strong>
                  </article>
                  <article className="gs-preview-stat">
                    <span className="gs-preview-label">Mood</span>
                    <strong>{previewGift.vibe}</strong>
                  </article>
                </div>

                <section className="gs-preview-panel is-primary">
                  <span className="gs-preview-label">Why it works</span>
                  <p className="gs-preview-detail-copy">{previewGift.why}</p>
                  {previewBudgetReadout ? (
                    <p className="gs-preview-panel-note">{previewBudgetReadout} for the lane you have selected.</p>
                  ) : null}
                </section>

                <div className="gs-preview-panel-grid">
                  <section className="gs-preview-panel">
                    <span className="gs-preview-label">Works for</span>
                    <div className="gs-preview-meta">
                      {previewRelationshipTags.map((tag) => (
                        <span key={`${previewGift.id}-relationship-${tag}`}>{tag}</span>
                      ))}
                    </div>
                  </section>
                  <section className="gs-preview-panel">
                    <span className="gs-preview-label">Gift angle</span>
                    <div className="gs-preview-meta">
                      {previewIntentTags.map((tag) => (
                        <span key={`${previewGift.id}-intent-${tag}`}>{tag}</span>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="gs-preview-actions">
                  <a
                    className="gs-primary-btn gs-preview-primary"
                    href={buildAffiliateLink(previewGift)}
                    target="_blank"
                    rel={AMAZON_AFFILIATE_REL}
                    {...getAffiliateAnchorData(previewGift, "preview-primary")}
                    aria-label={`Buy ${previewGift.name} on ${affiliateConfig.merchantName}`}
                  >
                    Buy on {affiliateConfig.merchantName}
                  </a>
                  <div className="gs-preview-secondary-actions">
                    <button
                      type="button"
                      className={classNames("gs-secondary-btn gs-preview-secondary", savedIds.includes(previewGift.id) && "is-active")}
                      onClick={() => toggleSaved(previewGift.id)}
                      aria-pressed={savedIds.includes(previewGift.id)}
                      aria-label={
                        savedIds.includes(previewGift.id)
                          ? `Remove ${previewGift.name} from saved picks`
                          : `Save ${previewGift.name}`
                      }
                    >
                      {savedIds.includes(previewGift.id) ? "Saved" : "Save"}
                    </button>
                    {previewSeoGift ? (
                      <a
                        className="gs-secondary-btn gs-preview-secondary"
                        href={`/gift/${previewSeoGift.slug}/`}
                        aria-label={`Open more details for ${previewGift.name}`}
                      >
                        Details
                      </a>
                    ) : null}
                  </div>
                </div>

                <p className="gs-preview-note">
                  {activePreviewMedia?.kind === "image"
                    ? "This preview is image-led."
                    : "The first click stays in the preview so you can watch first."}{" "}
                  Buying stays a separate second click on {affiliateConfig.merchantName}. {AMAZON_PAID_LINK_NOTE}. {AMAZON_ASSOCIATE_DISCLOSURE}
                </p>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
