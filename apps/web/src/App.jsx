import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Bookmark, BookmarkCheck, MapPin, Pause, Play, RefreshCw } from "lucide-react";
import { useInView } from "react-intersection-observer";
import Masonry from "react-masonry-css";
import {
  featuredSeoProducts,
  heroSeoProducts,
  librarySeoProducts,
  weeklyTopSeoProducts,
  seoCatalog,
  seoDateCities,
  seoGuides,
  seoHotStories,
  seoSite,
} from "./content/seo-guides.js";
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
  AMAZON_ASSOCIATE_DISCLOSURE,
  AMAZON_PAID_LINK_NOTE,
  DIRECT_MERCHANT_LINK_NOTE,
  buildAffiliateDataAttributes,
  resolveGiftCommerceLinkType,
  resolveGiftCommerceRel,
  resolveGiftMerchantName,
  usesDirectMerchantPath,
} from "./lib/affiliate.js";
import {
  DATE_SPOTS_PROVIDER_OPENTABLE,
  DEFAULT_DATE_SPOTS_PROVIDER,
  buildDateSpotSearchUrl,
  buildFallbackDateSpots,
  DEFAULT_DATE_PARTY_SIZE,
  formatDateTimeSummary,
  getDateSpotPoweredLabel,
  getDefaultDateTimeInput,
  resolveDateSpotProvider,
} from "./lib/date-spots.js";
import { createI18n } from "./lib/i18n.js";
import { applyDocumentLocale, buildLocaleBadge, formatDateForLocales, getLocaleProfile } from "./lib/locale.js";

const slides = [
  { id: "popular", label: "Popular", number: "01" },
  { id: "hot", label: "Trending", number: "02" },
  { id: "guides", label: "Date ideas", number: "03" },
  { id: "saved", label: "Saved", number: "04" },
];

const editorialSlides = slides.filter((slide) => slide.id !== "saved");

const relationshipOptions = [
  { id: "girlfriend", label: "Girlfriend", note: "Lower pressure, cleaner yes, easier first hit." },
  { id: "wife", label: "Wife", note: "Better room for stronger quality and repeat use." },
  { id: "anniversary", label: "Anniversary", note: "Higher signal and more emotional weight." },
  { id: "new-relationship", label: "New relationship", note: "Keep it sharp, simple, and easy to receive." },
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

const quickStartLanes = [
  {
    id: "new-relationship",
    eyebrow: "Lower pressure",
    title: "New relationship",
    description: "Lower-pressure first answer.",
    ctaLabel: "Use",
    guideHref: "/gifts-for-girlfriend/",
    guideLabel: "Guide",
    selection: {
      relationship: "new-relationship",
      budget: "under-50",
      signal: "best-overall",
      intent: "thoughtful",
    },
  },
  {
    id: "wife",
    eyebrow: "Higher signal",
    title: "Long-term partner",
    description: "More quality, stronger signal.",
    ctaLabel: "Use",
    guideHref: "/gifts-for-wife/",
    guideLabel: "Guide",
    selection: {
      relationship: "wife",
      budget: "premium",
      signal: "looks-expensive",
      intent: "thoughtful",
    },
  },
  {
    id: "last-minute",
    eyebrow: "Fast checkout",
    title: "Last-minute buyer",
    description: "Fast path, cleaner buy.",
    ctaLabel: "Use",
    guideHref: "/amazon-gifts-for-her/",
    guideLabel: "Guide",
    selection: {
      relationship: "girlfriend",
      budget: "under-100",
      signal: "best-overall",
      intent: "everyday",
    },
  },
];

const guideByRelationship = {
  girlfriend: {
    href: "/gifts-for-girlfriend/",
    label: "Open the girlfriend guide",
    chipLabel: "Girlfriend guide",
  },
  wife: {
    href: "/gifts-for-wife/",
    label: "Open the wife guide",
    chipLabel: "Wife guide",
  },
  anniversary: {
    href: "/anniversary-gifts-for-her/",
    label: "Open the anniversary guide",
    chipLabel: "Anniversary guide",
  },
  "new-relationship": {
    href: "/gifts-for-girlfriend/",
    label: "Open the low-pressure guide",
    chipLabel: "Low-pressure guide",
  },
};

const homepageGuideBuckets = [
  {
    id: "recipient",
    overline: "Recipient",
    title: "Shop by recipient",
    description: "Start with the relationship when you want the shortest path to the right shortlist.",
    guides: ["gifts-for-girlfriend", "gifts-for-wife", "anniversary-gifts-for-her"],
    allHref: "/guides/",
    allLabel: "See all gift guides",
  },
  {
    id: "budget",
    overline: "Budget",
    title: "Shop by budget",
    description: "Use these when price is fixed and presentation still matters.",
    guides: ["best-gifts-under-100", "best-gifts-under-75", "looks-expensive-gifts-for-her"],
    allHref: "/guides/",
    allLabel: "See all budget guides",
  },
  {
    id: "trending",
    overline: "Trending",
    title: "Current gift angles",
    description: "Directional pages for what feels current without digging through the full library.",
    guides: ["viral-gifts-for-her", "date-night-gifts-for-her", "last-minute-gifts-for-her"],
    allHref: "/hot/",
    allLabel: "View all trending pages",
  },
];

const pickerSlides = [
  { id: "start", label: "Start" },
  { id: "relationship", label: "Relationship" },
  { id: "budget", label: "Budget" },
  { id: "intent", label: "Vibe" },
  { id: "signal", label: "Lane" },
  { id: "result", label: "Gift" },
];

const datePartySizeOptions = Array.from({ length: 8 }, (_, index) => index + 1);
const dateSpotsApiPath = import.meta.env.VITE_DATE_SPOTS_API_PATH || "/api/date-spots";

const hotStoryHeights = [320, 360, 400, 340, 380, 430, 360, 410];
const HOT_FEED_TARGET_COUNT = 12;
const HOT_FEED_INITIAL_BATCH_COUNT = 2;
const HOT_FEED_MAX_BATCH_COUNT = 5;
const HOT_FEED_ROTATION_STEP = 3;
const previewReelFrameDurationMs = 1500;
const TIKTOK_PLAYER_ORIGIN = "https://www.tiktok.com";

function getStableSeed(...parts) {
  return parts.join("-").split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function getHotStoryHeight(giftId, storyId) {
  return hotStoryHeights[getStableSeed(giftId, storyId) % hotStoryHeights.length];
}

function buildLoopedHotStories(stories, cycleIndex, rotationOffset = 0) {
  if (!stories.length) {
    return [];
  }

  const rotation = (rotationOffset + cycleIndex * HOT_FEED_ROTATION_STEP) % stories.length;

  return stories.map((_, index) => {
    const story = stories[(index + rotation) % stories.length];

    return {
      ...story,
      cycleIndex,
      instanceId: `${story.id}-${story.gift.id}-cycle-${cycleIndex}-slot-${index}`,
    };
  });
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

function getOptionIndexById(options, id, fallback = 0) {
  const index = options.findIndex((option) => option.id === id);
  return index >= 0 ? index : fallback;
}

function buildBriefSelection(selection) {
  return {
    relationship: getOptionIndexById(relationshipOptions, selection.relationship, 1),
    budget: getOptionIndexById(budgetOptions, selection.budget, 1),
    signal: getOptionIndexById(signalOptions, selection.signal, 0),
    intent: getOptionIndexById(intentOptions, selection.intent, 0),
  };
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
      nativePosterUrl: video.posterUrl || "",
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
        sourceLabel: "ShopForHer",
      },
      ...imageItems,
    ];
  }

  return imageItems;
}

function isTikTokPreviewMedia(media) {
  return media?.kind === "embed" && media.provider === "tiktok" && Boolean(media.videoId || media.embedUrl);
}

function getPrimaryHotVideoMedia(gift) {
  const mediaItems = buildGiftPreviewMedia(gift);

  return mediaItems.find((media) => isTikTokPreviewMedia(media) && media.nativePosterUrl)
    || mediaItems.find((media) => isTikTokPreviewMedia(media))
    || null;
}

function getHotFallbackLabel(gift) {
  if (gift.relationships?.includes("wife")) {
    return "For wives";
  }

  if (gift.relationships?.includes("girlfriend")) {
    return "For girlfriends";
  }

  if (gift.tabs?.includes("looks-expensive")) {
    return "Polished";
  }

  if (gift.tabs?.includes("daily-use")) {
    return "Actually useful";
  }

  if (gift.tabs?.includes("cozy-home")) {
    return "Cozy home";
  }

  return "Trending";
}

function getHotFallbackHeat(gift) {
  if (gift.priceValue <= 50) {
    return "Quick buy";
  }

  if (gift.tabs?.includes("looks-expensive")) {
    return "Looks strong";
  }

  if (gift.tabs?.includes("daily-use")) {
    return "Repeat use";
  }

  if (gift.tabs?.includes("cozy-home")) {
    return "Soft lane";
  }

  return "Rising";
}

function getProductPageHref(slug) {
  if (!slug) {
    return "/";
  }

  return `/gift/${slug}/`;
}

function buildIndexableSeoGiftIds(seoCatalog) {
  return new Set(
    seoCatalog
      .filter((gift) => gift.sourceProductUrl || gift.affiliateUrl || gift.amazonAsin || gift.asin)
      .map((gift) => gift.id)
  );
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

function AnimatedBentoCard({
  gift,
  index,
  options,
  isSaved,
  onToggleSaved,
  onOpenPreview,
  getGiftCommerceRel,
  getAffiliateAnchorData,
  getGiftCommerceAriaLabel,
}) {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "0px 0px -50px 0px" });
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
          onClick={() => onOpenPreview(gift)}
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
                  onClick={() => onOpenPreview(gift)}
                  aria-label={`Preview ${gift.name}`}
                >
                  <Play />
                </button>
                <button
                  type="button"
                  className={classNames("gs-icon-btn", isSaved && "is-active")}
                  onClick={() => onToggleSaved(gift.id)}
                  aria-pressed={isSaved}
                  aria-label={isSaved ? `Remove ${gift.name} from saved picks` : `Save ${gift.name}`}
                >
                  {isSaved ? <BookmarkCheck /> : <Bookmark />}
                </button>
                <a
                  className="gs-icon-btn"
                  href={buildAffiliateLink(gift)}
                  target="_blank"
                  rel={getGiftCommerceRel(gift)}
                  {...getAffiliateAnchorData(gift, "bento-card-icon")}
                  aria-label={getGiftCommerceAriaLabel(gift)}
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

function HotFeedMedia({ item, gift, shouldLoadEmbed }) {
  const media = useMemo(() => {
    const mediaItems = buildGiftPreviewMedia(gift);

    return mediaItems.find((candidate) => candidate.id === item.mediaId) || getPrimaryHotVideoMedia(gift);
  }, [gift, item.mediaId]);
  const posterUrl = media?.nativePosterUrl || media?.posterUrl || getGiftImageUrl(gift);
  const embedUrl =
    shouldLoadEmbed && media?.provider === "tiktok"
      ? buildTikTokPlayerUrl(media.videoId, {
          autoplay: 0,
          controls: 0,
          description: 0,
          music_info: 0,
          rel: 0,
        }) || media?.embedUrl || ""
      : "";
  const [embedLoaded, setEmbedLoaded] = useState(false);

  useEffect(() => {
    setEmbedLoaded(false);
  }, [embedUrl]);

  return (
    <div className="gs-hot-feed-media">
      <div className="gs-hot-feed-video-placeholder" aria-hidden={embedUrl && embedLoaded ? "true" : undefined}>
        {posterUrl ? <img src={posterUrl} alt="" className="gs-hot-feed-poster" loading="lazy" /> : null}
        <span className="gs-hot-feed-video-placeholder-scrim" aria-hidden="true" />
        <span>Open video</span>
      </div>

      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={media?.title || `${gift.name} TikTok video`}
          className="gs-hot-feed-embed"
          loading="lazy"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          onLoad={() => setEmbedLoaded(true)}
        />
      ) : null}

      {(item.mediaLabel || item.durationLabel) ? (
        <div className="gs-hot-feed-media-badges" aria-hidden="true">
          <span className="gs-hot-feed-floating-chip">
            <Play size={12} />
            <span>Watch</span>
          </span>
          {item.mediaLabel ? <span className="gs-hot-feed-floating-chip">{item.mediaLabel}</span> : null}
          {item.durationLabel ? <span className="gs-hot-feed-floating-chip">{item.durationLabel}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function AnimatedHotCard({ item, index, onOpenHotPreview }) {
  const { ref, inView } = useInView({ triggerOnce: false, rootMargin: "180px 0px 180px 0px" });
  const [hasEntered, setHasEntered] = useState(false);
  const gift = item.gift;
  const delayClass = index % 3 === 1 ? "delay-100" : index % 3 === 2 ? "delay-200" : "";
  const storyHeight = getHotStoryHeight(gift.id, item.id);

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
        "--hot-story-height": `${storyHeight}px`,
      }}
    >
      <button
        type="button"
        className="gs-hot-feed-hit"
        onClick={() => onOpenHotPreview(item)}
        aria-label={`Open ${gift.name} video full screen`}
      >
        <HotFeedMedia item={item} gift={gift} shouldLoadEmbed={inView || hasEntered} />
        <div className="gs-hot-feed-body">
          <div className="gs-hot-feed-chip-row">
            <span className="gs-hot-feed-chip">{item.label}</span>
            {item.heat && <span className="gs-hot-feed-chip is-heat">{item.heat}</span>}
          </div>
          <h3>{gift.name}</h3>
          <p>{gift.why || gift.hook}</p>
          <div className="gs-hot-feed-meta">
            <div className="gs-hot-feed-source">
              <span className="gs-hot-feed-source-mark">TT</span>
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

export default function App() {
  const touchRef = useRef({ x: 0, y: 0 });
  const tabRefs = useRef([]);
  const slideScrollRefs = useRef([]);
  const decisionPanelRef = useRef(null);
  const topPicksRef = useRef(null);
  const hotScrollRef = useRef(null);
  const hotFeedBatchRefs = useRef(new Map());
  const hotFeedCanAppendRef = useRef(true);
  const previewCloseRef = useRef(null);
  const previewVideoRef = useRef(null);
  const previewEmbedRef = useRef(null);
  const initialDateTime = getDefaultDateTimeInput();
  const [catalog, setCatalog] = useState(() => readLiveCatalog());
  const [activeSlide, setActiveSlide] = useState(0);
  const [savedIds, setSavedIds] = useState(() => loadSaved());
  const [previewGift, setPreviewGift] = useState(null);
  const [previewMode, setPreviewMode] = useState("default");
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
    note: "Use your location to load nearby plans.",
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
  const [pickerStep, setPickerStep] = useState(0);
  const [hotFeedCycles, setHotFeedCycles] = useState([]);
  const [hotFeedRotationOffset, setHotFeedRotationOffset] = useState(0);
  const { ref: hotFeedSentinelRef, inView: hotFeedSentinelInView } = useInView({
    triggerOnce: false,
    rootMargin: "900px 0px 1200px 0px",
  });
  const seoCatalogById = useMemo(() => new Map(seoCatalog.map((gift) => [gift.id, gift])), [seoCatalog]);
  const seoGuidesBySlug = useMemo(() => new Map(seoGuides.map((guide) => [guide.slug, guide])), []);
  const indexableSeoGiftIds = useMemo(() => buildIndexableSeoGiftIds(seoCatalog), [seoCatalog]);
  const rawPreviewMediaItems = useMemo(() => buildGiftPreviewMedia(previewGift), [previewGift]);
  const previewMediaItems = useMemo(
    () => (previewMode === "hot" ? rawPreviewMediaItems.filter((media) => isTikTokPreviewMedia(media)) : rawPreviewMediaItems),
    [previewMode, rawPreviewMediaItems]
  );
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

    return buildTikTokPlayerUrl(
      activePreviewMedia.videoId,
      previewMode === "hot"
        ? {
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
          }
        : {
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
          }
    );
  }, [
    activePreviewMedia?.embedUrl,
    activePreviewMedia?.id,
    activePreviewMedia?.kind,
    activePreviewMedia?.provider,
    activePreviewMedia?.videoId,
    previewMode,
  ]);
  const activePreviewReelFrame = activePreviewMedia?.kind === "reel"
    ? activePreviewMedia.frames?.[previewReelFrameIndex] || activePreviewMedia.posterUrl || activePreviewPoster
    : "";
  const activePreviewDurationLabel = formatDurationLabel(activePreviewMedia?.durationSeconds || 0);
  const activePreviewSourceLabel =
    activePreviewMedia?.creatorHandle || activePreviewMedia?.creatorName || activePreviewMedia?.sourceLabel || "ShopForHer";
  const localeProfile = useMemo(() => getLocaleProfile(), []);
  const i18n = useMemo(() => createI18n(localeProfile), [localeProfile]);
  const t = i18n.t;
  const popularLocaleBadge = useMemo(() => buildLocaleBadge(localeProfile), [localeProfile]);

  const { affiliateConfig, gifts } = catalog;

  useEffect(() => {
    return subscribeToCatalogUpdates(() => {
      setCatalog(readLiveCatalog());
    });
  }, []);

  useEffect(() => {
    applyDocumentLocale(localeProfile);
  }, [localeProfile]);

  useEffect(() => {
    setGeoState((current) => {
      const nextLabel =
        current.status === "unsupported" || current.status === "unavailable"
          ? t("plans.locationUnavailable")
          : current.status === "loading"
            ? t("plans.locating")
            : current.status === "ready"
              ? t("plans.nearYou")
              : current.status === "denied"
                ? t("plans.locationBlocked")
                : t("plans.previewArea");

      return current.label === nextLabel ? current : { ...current, label: nextLabel };
    });

    setDateResults((current) => {
      if (current.status !== "idle" || current.mode !== "idle") {
        return current;
      }

      const nextAreaLabel = t("plans.previewArea");
      const nextNote = t("plans.useLocationNote");

      if (current.areaLabel === nextAreaLabel && current.note === nextNote) {
        return current;
      }

      return {
        ...current,
        areaLabel: nextAreaLabel,
        note: nextNote,
      };
    });
  }, [t]);

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
  const relationshipLabel = t(`relationship.${activeRelationship.id}`);
  const budgetLabel = t(`budget.${activeBudget.id}`);
  const signalLabel = t(`signal.${activeSignal.id}`);
  const intentLabel = t(`intent.${activeIntent.id}`);
  const homeUpdatedSource = seoSite.updatedAt || new Date().toISOString().slice(0, 10);
  const homeUpdatedLabel = formatDateForLocales(`${homeUpdatedSource}T00:00:00`, localeProfile.locales, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const getSlideLabel = (slideId) => t(`nav.${slideId === "guides" ? "plans" : slideId}`);
  const getRelationshipLabel = (relationshipId) => t(`relationship.${relationshipId}`);
  const getBudgetLabel = (budgetId) => t(`budget.${budgetId}`);
  const getSignalLabel = (signalId) => t(`signal.${signalId}`);
  const getIntentLabel = (intentId) => t(`intent.${intentId}`);
  const getLaneText = (laneId, field) => t(`lane.${laneId}.${field}`);
  const getGuideText = (relationshipId, field) => t(`guide.${relationshipId}.${field}`);

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
  const weeklyTopCatalogProducts = useMemo(
    () =>
      weeklyTopSeoProducts
        .map((weeklyGift) => gifts.find((gift) => gift.id === weeklyGift.id))
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
  const libraryProducts = useMemo(
    () =>
      librarySeoProducts
        .map((gift) => {
          const catalogGift = gifts.find((candidate) => candidate.id === gift.id);
          return catalogGift ? { ...catalogGift, slug: gift.slug } : null;
        })
        .filter(Boolean)
        .filter((gift) => gift?.id && indexableSeoGiftIds.has(gift.id)),
    [gifts, indexableSeoGiftIds]
  );
  const compactBrowseProducts = useMemo(() => {
    const excludedIds = new Set([
      ...weeklyTopCatalogProducts.map((gift) => gift.id),
      ...featuredCatalogProducts.map((gift) => gift.id),
      ...heroCatalogProducts.map((gift) => gift.id),
    ]);

    return libraryProducts.filter((gift) => !excludedIds.has(gift.id)).slice(0, 8);
  }, [libraryProducts, weeklyTopCatalogProducts, featuredCatalogProducts, heroCatalogProducts]);
  const popularHeroProducts = heroCatalogProducts.length ? heroCatalogProducts : linkedTopProducts.slice(0, 3);
  const leadRecommendation = topPicks[0] || popularHeroProducts[0] || null;
  const activeGuide = guideByRelationship[activeRelationship.id] || guideByRelationship.girlfriend;
  const activeGuideChipLabel = getGuideText(activeRelationship.id, "chip");
  const curatedHomepageGuideBuckets = homepageGuideBuckets
    .map((bucket) => ({
      ...bucket,
      guides: bucket.guides.map((slug) => seoGuidesBySlug.get(slug)).filter(Boolean),
    }))
    .filter((bucket) => bucket.guides.length);
  const pickerResultStep = pickerSlides.length - 1;
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
    activeDateSpot?.mapUrl && activeDateSpot.mapUrl !== activeDateSpot.bookingUrl ? t("plans.openMaps") : t("plans.nearbySearch");
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
    ? (previewGift.relationships || []).slice(0, 4).map((value) => t(`relationship.${value}`) || stateLabels[value] || value)
    : [];
  const previewIntentTags = previewGift
    ? (previewGift.intents || []).slice(0, 4).map((value) => t(`intent.${value}`) || stateLabels[value] || value)
    : [];
  const previewHeadlineTags = previewGift
    ? [previewGift.priceLabel, previewGift.badge, activePreviewSourceLabel].filter(Boolean)
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

    const eligibleTikTokGifts = gifts.filter((gift) => getPrimaryHotVideoMedia(gift));
    const rankedTikTokGifts = [...eligibleTikTokGifts].sort((left, right) => {
      const scoreDelta = scoreGift(right, activeFilters) - scoreGift(left, activeFilters);

      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return (right.baseScore || 0) - (left.baseScore || 0);
    });
    const usedGiftIds = new Set();
    const usedVideoIds = new Set();

    const seededStories = definitions
      .map((story) => {
        const picks = rankGiftMatches(rankedTikTokGifts, { ...activeFilters, ...story.filters });
        const gift = picks.find((candidate) => {
          if (usedGiftIds.has(candidate.id)) {
            return false;
          }

          const primaryVideo = getPrimaryHotVideoMedia(candidate);

          if (!primaryVideo) {
            return false;
          }

          const videoKey = primaryVideo.videoId || primaryVideo.embedUrl || primaryVideo.id;

          return !usedVideoIds.has(videoKey);
        }) || null;

        if (!gift) {
          return null;
        }

        const primaryVideo = getPrimaryHotVideoMedia(gift);

        if (!primaryVideo) {
          return null;
        }

        usedGiftIds.add(gift.id);
        usedVideoIds.add(primaryVideo.videoId || primaryVideo.embedUrl || primaryVideo.id);

        return {
          ...story,
          gift,
          mediaId: primaryVideo.id,
          mediaKind: "embed",
          mediaLabel: "TikTok",
          sourceLabel:
            primaryVideo.creatorHandle || primaryVideo.creatorName || primaryVideo.sourceLabel || "TikTok",
          durationLabel: formatDurationLabel(primaryVideo.durationSeconds || 0),
        };
      })
      .filter(Boolean);

    const fallbackStories = rankedTikTokGifts
      .map((gift) => {
        if (usedGiftIds.has(gift.id)) {
          return null;
        }

        const primaryVideo = getPrimaryHotVideoMedia(gift);

        if (!primaryVideo) {
          return null;
        }

        const videoKey = primaryVideo.videoId || primaryVideo.embedUrl || primaryVideo.id;

        if (usedVideoIds.has(videoKey)) {
          return null;
        }

        usedGiftIds.add(gift.id);
        usedVideoIds.add(videoKey);

        return {
          id: `fallback-${gift.id}`,
          label: getHotFallbackLabel(gift),
          heat: getHotFallbackHeat(gift),
          gift,
          mediaId: primaryVideo.id,
          mediaKind: "embed",
          mediaLabel: "TikTok",
          sourceLabel:
            primaryVideo.creatorHandle || primaryVideo.creatorName || primaryVideo.sourceLabel || "TikTok",
          durationLabel: formatDurationLabel(primaryVideo.durationSeconds || 0),
        };
      })
      .filter(Boolean);

    return [...seededStories, ...fallbackStories].slice(0, HOT_FEED_TARGET_COUNT);
  }, [gifts, activeFilters]);
  const leadingHotFeedCycle = hotFeedCycles[0] ?? null;
  const trailingHotFeedCycles = hotFeedCycles.slice(1);

  function refreshHotFeed() {
    if (!videoStories.length) {
      return;
    }

    hotFeedCanAppendRef.current = true;
    setHotFeedRotationOffset((current) => (current + HOT_FEED_ROTATION_STEP * HOT_FEED_INITIAL_BATCH_COUNT) % videoStories.length);
    setHotFeedCycles(Array.from({ length: HOT_FEED_INITIAL_BATCH_COUNT }, (_, index) => index));

    requestAnimationFrame(() => {
      hotScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  useEffect(() => {
    if (activeSlide === datesSlideIndex && geoState.status === "idle") {
      useMyArea();
    }
  }, [activeSlide, datesSlideIndex, geoState.status]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      slideScrollRefs.current[activeSlide]?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeSlide]);

  useEffect(() => {
    hotFeedCanAppendRef.current = true;

    if (!videoStories.length) {
      setHotFeedCycles([]);
      return;
    }

    setHotFeedRotationOffset(0);
    setHotFeedCycles(
      Array.from({ length: HOT_FEED_INITIAL_BATCH_COUNT }, (_, index) => index)
    );
  }, [videoStories]);

  useEffect(() => {
    if (activeSlide !== 1 || !videoStories.length) {
      return;
    }

    if (!hotFeedSentinelInView) {
      hotFeedCanAppendRef.current = true;
      return;
    }

    if (!hotFeedCanAppendRef.current) {
      return;
    }

    hotFeedCanAppendRef.current = false;

    setHotFeedCycles((current) => {
      if (!current.length) {
        return [0];
      }

      let next = [...current, current[current.length - 1] + 1];

      if (next.length > HOT_FEED_MAX_BATCH_COUNT) {
        const removedCycle = next[0];
        const removedHeight = hotFeedBatchRefs.current.get(removedCycle)?.offsetHeight || 0;
        next = next.slice(1);

        if (removedHeight && hotScrollRef.current) {
          requestAnimationFrame(() => {
            if (!hotScrollRef.current) {
              return;
            }

            hotScrollRef.current.scrollTop = Math.max(
              0,
              hotScrollRef.current.scrollTop - removedHeight
            );
          });
        }
      }

      return next;
    });
  }, [activeSlide, hotFeedSentinelInView, videoStories.length]);

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
      const fallbackReady =
        geoState.status === "denied" || geoState.status === "unsupported" || geoState.status === "unavailable";

      setDateResults({
        provider,
        status: geoState.status === "loading" ? "loading" : fallbackReady ? "ready" : "idle",
        mode: fallbackReady ? "fallback" : "idle",
        areaLabel: geoState.label,
        note:
          geoState.status === "denied"
            ? t("plans.locationBlockedNote")
            : geoState.status === "unsupported"
              ? t("plans.locationUnsupportedNote")
              : geoState.status === "unavailable"
                ? t("plans.locationUnavailableNote")
              : geoState.status === "loading"
                  ? t("plans.locatingNote")
                  : t("plans.useLocationNote"),
        sourceLabel: getDateSpotPoweredLabel(provider),
        searchUrl,
        spots: fallbackReady
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
          note: t("plans.searchingNearYou", {
            count: dateSearch.partySize,
            partyLabel: dateSearch.partySize === 1 ? t("date.person") : t("date.people"),
            when: formatDateTimeSummary(dateSearch.dateTime, localeProfile.locales),
          }),
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
          note: payload.note || t("plans.nearbyReady"),
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
          note: t("plans.nearbyUnavailable"),
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
  }, [dateSearch.dateTime, dateSearch.partySize, geoState.coords, geoState.label, geoState.status, localeProfile.locales]);

  function setSlide(index) {
    const nextIndex = Math.max(0, Math.min(slides.length - 1, index));
    setActiveSlide(nextIndex);
  }

  function setTabRef(index, node) {
    tabRefs.current[index] = node;
  }

  function setSlideScrollRef(index, node) {
    slideScrollRefs.current[index] = node;

    if (index === 1) {
      hotScrollRef.current = node;
    }
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

  function scrollToSection(ref) {
    ref?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function goToPickerStep(step) {
    const nextStep = Math.max(0, Math.min(step, pickerResultStep));
    setPickerStep(nextStep);

    requestAnimationFrame(() => {
      scrollToSection(decisionPanelRef);
    });
  }

  function updateBriefAndAdvance(key, value, nextStep) {
    updateBrief(key, value);
    goToPickerStep(nextStep);
  }

  function updateSignalAndAdvance(id) {
    updateSignalById(id);
    goToPickerStep(pickerResultStep);
  }

  function applyBriefSelection(selection, target = "decision") {
    setBrief(buildBriefSelection(selection));

    requestAnimationFrame(() => {
      if (target === "top-picks") {
        scrollToSection(topPicksRef);
        return;
      }

      goToPickerStep(pickerResultStep);
    });
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

  function getGiftCommerceSource(gift) {
    return seoCatalogById.get(gift.id) || gift;
  }

  function getGiftMerchantName(gift) {
    return resolveGiftMerchantName(getGiftCommerceSource(gift), affiliateConfig.merchantName);
  }

  function hasDirectMerchantLink(gift) {
    return usesDirectMerchantPath(getGiftCommerceSource(gift));
  }

  function getGiftCommerceRel(gift) {
    return resolveGiftCommerceRel(getGiftCommerceSource(gift));
  }

  function getGiftCommerceLinkType(gift) {
    return resolveGiftCommerceLinkType(getGiftCommerceSource(gift));
  }

  function getGiftCommerceActionLabel(gift) {
    const merchant = getGiftMerchantName(gift);

    return hasDirectMerchantLink(gift)
      ? t("generic.visitMerchant", { merchant })
      : t("generic.buyOnMerchant", { merchant });
  }

  function getGiftPrimaryCtaText(gift) {
    if (hasDirectMerchantLink(gift)) {
      return t("generic.visitMerchant", { merchant: getGiftMerchantName(gift) });
    }

    return t("generic.buyNow");
  }

  function getGiftCommerceAriaLabel(gift) {
    return `${getGiftCommerceActionLabel(gift)}: ${gift.name}`;
  }

  function getGiftCommerceDisclosure(gift) {
    const merchant = getGiftMerchantName(gift);

    if (hasDirectMerchantLink(gift)) {
      return `Buying stays a separate second click on ${merchant}. ${DIRECT_MERCHANT_LINK_NOTE}.`;
    }

    return `Buying stays a separate second click on ${merchant}. ${AMAZON_PAID_LINK_NOTE}. ${AMAZON_ASSOCIATE_DISCLOSURE}`;
  }

  function getAffiliateAnchorData(gift, placement) {
    const seoGift = getGiftCommerceSource(gift);

    return buildAffiliateDataAttributes({
      gift,
      placement,
      merchant: getGiftMerchantName(gift),
      slug: seoGift?.slug || "",
      linkType: getGiftCommerceLinkType(gift),
    });
  }

  function openPreview(gift, options = {}) {
    const nextMode = options.mode || "default";
    const availableMedia = buildGiftPreviewMedia(gift);
    const scopedMedia = nextMode === "hot" ? availableMedia.filter((media) => isTikTokPreviewMedia(media)) : availableMedia;
    const preferredMediaIndex = options.preferredMediaId
      ? scopedMedia.findIndex((media) => media.id === options.preferredMediaId)
      : -1;

    setPreviewMode(nextMode);
    setPreviewMediaIndex(preferredMediaIndex >= 0 ? preferredMediaIndex : 0);
    setPreviewPlaybackActive(true);
    setPreviewReelFrameIndex(0);
    setPreviewGift(gift);
  }

  function openHotPreview(item) {
    const media = getPrimaryHotVideoMedia(item.gift);

    if (!media) {
      return;
    }

    openPreview(item.gift, {
      mode: "hot",
      preferredMediaId: media.id,
    });
  }

  function closePreview() {
    setPreviewMode("default");
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
      return `${previewGift.hook} Tap once to play or pause the product reel, then use ${getGiftCommerceActionLabel(previewGift)} as the second click.`;
    }

    if (activePreviewMedia?.kind === "video") {
      return `${previewGift.hook} Watch the clip here first, then use ${getGiftCommerceActionLabel(previewGift)} if the product still looks right.`;
    }

    if (activePreviewMedia?.kind === "embed") {
      return `${previewGift.hook} Tap once to play or pause the TikTok here, then use ${getGiftCommerceActionLabel(previewGift)} as the second click.`;
    }

    return previewGift.hook;
  }

  function useMyArea() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState({ status: "unsupported", label: t("plans.locationUnavailable"), coords: null });
      return;
    }

    setGeoState((current) => ({ ...current, status: "loading", label: t("plans.locating") }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoState({
          status: "ready",
          label: t("plans.nearYou"),
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      },
      (error) => {
        const permissionDenied = error?.code === 1 || error?.code === error?.PERMISSION_DENIED;

        setGeoState({
          status: permissionDenied ? "denied" : "unavailable",
          label: permissionDenied ? t("plans.locationBlocked") : t("plans.locationUnavailable"),
          coords: null,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 120000,
      }
    );
  }

  function renderBentoCard(gift, index, options = {}) {
    return (
      <AnimatedBentoCard
        key={`${gift.id}-bento-${index}`}
        gift={gift}
        index={index}
        options={options}
        isSaved={savedIds.includes(gift.id)}
        onToggleSaved={toggleSaved}
        onOpenPreview={openPreview}
        getGiftCommerceRel={getGiftCommerceRel}
        getAffiliateAnchorData={getAffiliateAnchorData}
        getGiftCommerceAriaLabel={getGiftCommerceAriaLabel}
      />
    );
  }

  function renderGiftCard(gift, index, options = {}) {
    const isSaved = savedIds.includes(gift.id);
    const {
      eyebrow = gift.badge,
      deck = gift.hook,
      meta = [gift.priceLabel, gift.bestFor].filter(Boolean),
      primaryLabel = getGiftPrimaryCtaText(gift),
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
            rel={getGiftCommerceRel(gift)}
            {...getAffiliateAnchorData(gift, "product-card-primary")}
            aria-label={getGiftCommerceAriaLabel(gift)}
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
              rel={getGiftCommerceRel(gift)}
              {...getAffiliateAnchorData(gift, "saved-row-primary")}
            >
              <span className="gs-visually-hidden">{`${getGiftCommerceActionLabel(gift)}: ${gift.name}. `}</span>
              {getGiftPrimaryCtaText(gift)}
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
          <p>{t("footer.tagline")}</p>
        </div>
        <div className="gs-footer-meta">
          <p className="gs-footer-disclosure">{AMAZON_ASSOCIATE_DISCLOSURE}</p>
          <p>{t("footer.paidLinks")}</p>
          <p>{t("footer.savedPicks")}</p>
          <div className="gs-footer-links">
            <a href="/about.html">{t("footer.about")}</a>
            <a href="/editorial-policy.html">{t("footer.editorial")}</a>
            <a href="/contact.html">{t("footer.contact")}</a>
            <a href="/site-map.html">{t("footer.siteMap")}</a>
            <a href="/guides/">{t("footer.guides")}</a>
            <a href="/hot/">{t("footer.hot")}</a>
            <a href="/dates/">{t("footer.plans")}</a>
            <a href="/privacy.html">{t("footer.privacy")}</a>
            <a href="/terms.html">{t("footer.terms")}</a>
            <a href="/affiliate-disclosure.html">{t("footer.affiliate")}</a>
          </div>
          <a href="mailto:hello@shopforher.org">hello@shopforher.org</a>
        </div>
      </footer>
    );
  }

  const dateStatusLabel =
    dateResults.status === "loading"
      ? t("plans.statusFinding")
      : dateResults.mode === "live"
        ? t("plans.statusNearby", {
          count: dateResults.spots.length,
          optionLabel: dateResults.spots.length === 1 ? t("date.option") : t("date.options"),
        })
        : dateResults.mode === "unconfigured" || dateResults.mode === "fallback"
          ? t("plans.statusBackup")
        : t("plans.statusLocationNeeded");

  const datePoweredCopy =
    dateResults.mode === "live"
      ? activeDateProvider === DATE_SPOTS_PROVIDER_OPENTABLE
        ? t("plans.poweredLiveOpenTable")
        : t("plans.poweredLiveGoogle")
      : dateResults.mode === "unconfigured" || dateResults.mode === "fallback" || dateResults.status === "error"
        ? t("plans.poweredFallback")
        : t("plans.poweredIdle");
  function getDateSpotSummaryLabel(spot) {
    return [spot.distanceLabel, spot.priceHint].filter(Boolean).join(" · ") || spot.sourceLabel;
  }

  function setHotFeedBatchRef(cycleIndex, node) {
    if (node) {
      hotFeedBatchRefs.current.set(cycleIndex, node);
      return;
    }

    hotFeedBatchRefs.current.delete(cycleIndex);
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
            <a href="/" className="gs-brand" aria-label={t("brand.homeAria")}>
              <img src="/logo1.png" alt="ShopForHer" className="gs-logo" />
            </a>
            <nav className="gs-header-tabs" aria-label={t("nav.giftPagesAria")}>
              <div className="gs-header-tabs-inner" role="tablist" aria-label={t("nav.giftPagesAria")}>
                {editorialSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    ref={(node) => setTabRef(index, node)}
                    id={`tab-${slide.id}`}
                    role="tab"
                    type="button"
                    className={classNames(
                      "gs-site-link",
                      slide.id === "popular" && "has-locale-badge",
                      activeSlide === index && "is-active"
                    )}
                    onClick={() => setSlide(index)}
                    onKeyDown={(event) => onTabKeyDown(event, index)}
                    aria-selected={activeSlide === index}
                    aria-controls={`panel-${slide.id}`}
                    tabIndex={activeSlide === index ? 0 : -1}
                    title={slide.id === "popular" ? popularLocaleBadge.title : undefined}
                  >
                    {slide.id === "popular" ? (
                      <>
                        <span className="gs-site-link-badge" aria-hidden="true">
                          {popularLocaleBadge.emoji}
                        </span>
                        <span className="gs-visually-hidden">{popularLocaleBadge.screenReaderLabel}</span>
                      </>
                    ) : null}
                    <span className="gs-site-link-label">{getSlideLabel(slide.id)}</span>
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
                  {t("nav.saved")}
                  <span className="gs-nav-save-count" aria-live="polite" aria-atomic="true">
                    <span className="gs-visually-hidden">{`${t("nav.savedCountSr")} `}</span>
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
              <div className="gs-slide-scroll" ref={(node) => setSlideScrollRef(0, node)}>
                <section className="gs-popular-hero gs-home-hero">
                  <div className="gs-popular-hero-copy gs-home-hero-copy">
                    <div className="gs-home-hero-head">
                      <p className="gs-overline">{t("home.overline")}</p>
                      <h1>{t("home.title")}</h1>
                      <p className="gs-home-hero-lede">{t("home.lede")}</p>
                    </div>
                    <div className="gs-home-hero-actions">
                      <button
                        type="button"
                        className="gs-primary-btn"
                        onClick={() => scrollToSection(decisionPanelRef)}
                      >
                        {t("home.startPicker")}
                      </button>
                      <button
                        type="button"
                        className="gs-secondary-btn"
                        onClick={() => scrollToSection(topPicksRef)}
                      >
                        {t("home.seeMostBought")}
                      </button>
                    </div>
                    <p className="gs-home-hero-summary">
                      {t("home.summary", { updated: homeUpdatedLabel })}
                    </p>
                    <button
                      type="button"
                      className="gs-popular-next-indicator"
                      onClick={() => setSlide(1)}
                      aria-label={t("home.openHotAria")}
                    >
                      <span>{t("home.openHotLabel")}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="gs-popular-hero-visual">
                    <div className="gs-popular-hero-art-shell">
                      <img
                        src="/brand-art/homepage-hero-merch-line.png"
                        alt="Curated premium gifts including a jewelry case, mug, candle warmer lamp, silk accessory, slippers, picture frame, and projector."
                        className="gs-popular-hero-art"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </section>

                <section
                  ref={decisionPanelRef}
                  className="gs-home-decision-shell gs-home-decision-module"
                  aria-labelledby="gs-home-decision-title"
                >
                  <div className="gs-home-module-head">
                    <div className="gs-home-module-copy">
                      <p className="gs-overline">{t("home.moduleOverline")}</p>
                      <h3 id="gs-home-decision-title">{t("home.moduleTitle")}</h3>
                      <p className="gs-home-section-note">{t("home.moduleNote")}</p>
                    </div>
                    <div className="gs-home-module-meta" aria-label={t("home.moduleOverline")}>
                      <span className="gs-trust-chip">{t("home.trust.lowRisk")}</span>
                      <span className="gs-trust-chip">{t("home.trust.disclosed")}</span>
                      <span className="gs-trust-chip">{t("home.trust.updated", { updated: homeUpdatedLabel })}</span>
                    </div>
                  </div>
                  <div className="gs-home-picker-progress" aria-label={t("home.moduleTitle")}>
                    {pickerSlides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        className={classNames("gs-home-picker-progress-step", pickerStep === index && "is-active")}
                        onClick={() => goToPickerStep(index)}
                        aria-current={pickerStep === index ? "step" : undefined}
                      >
                        {t(`picker.${slide.id}`)}
                      </button>
                    ))}
                  </div>
                  <div className="gs-home-picker-viewport">
                    <div
                      className="gs-home-picker-track"
                      style={{ transform: `translateX(-${pickerStep * 100}%)` }}
                    >
                      <section
                        className="gs-home-picker-slide"
                        aria-hidden={pickerStep !== 0}
                        tabIndex={pickerStep === 0 ? 0 : -1}
                      >
                        <div className="gs-home-picker-panel is-intro">
                          <div className="gs-home-picker-copy">
                            <span className="gs-seo-guide-eyebrow">{t("picker.startEyebrow")}</span>
                            <h4>{t("picker.startTitle")}</h4>
                            <p>{t("picker.startBody")}</p>
                          </div>
                          <div className="gs-home-quick-start-row" aria-label="Audience quick starts">
                            {quickStartLanes.map((lane) => (
                              <article key={lane.id} className="gs-home-quick-start-card is-condensed">
                                <div className="gs-home-quick-start-copy">
                                  <span className="gs-seo-guide-eyebrow">{getLaneText(lane.id, "eyebrow")}</span>
                                  <h4>{getLaneText(lane.id, "title")}</h4>
                                  <p>{getLaneText(lane.id, "description")}</p>
                                </div>
                                <div className="gs-home-quick-start-actions is-inline">
                                  <button
                                    type="button"
                                    className="gs-secondary-btn"
                                    onClick={() => applyBriefSelection(lane.selection)}
                                  >
                                    {getLaneText(lane.id, "cta")}
                                  </button>
                                  <a href={lane.guideHref} className="gs-home-inline-link">
                                    {getLaneText(lane.id, "guide")}
                                  </a>
                                </div>
                              </article>
                            ))}
                          </div>
                          <div className="gs-home-picker-footer">
                            <button
                              type="button"
                              className="gs-primary-btn"
                              onClick={() => goToPickerStep(1)}
                            >
                              {t("picker.buildManually")}
                            </button>
                            <a href="/amazon-gifts-for-her/" className="gs-home-inline-link">
                              {t("picker.needSpeed")}
                            </a>
                          </div>
                        </div>
                      </section>

                      <section
                        className="gs-home-picker-slide"
                        aria-hidden={pickerStep !== 1}
                        tabIndex={pickerStep === 1 ? 0 : -1}
                      >
                        <div className="gs-home-question gs-home-picker-panel" aria-label="Relationship stage">
                          <div className="gs-home-picker-step-copy">
                            <span className="gs-home-step-number">01</span>
                            <div>
                              <h4>{t("picker.relationshipTitle")}</h4>
                              <p>{t("picker.relationshipBody")}</p>
                            </div>
                          </div>
                          <div className="gs-home-choice-grid">
                            {relationshipOptions.map((option, index) => (
                              <button
                                key={option.id}
                                type="button"
                                className={classNames("gs-home-choice", brief.relationship === index && "is-active")}
                                onClick={() => updateBriefAndAdvance("relationship", index, 2)}
                                aria-pressed={brief.relationship === index}
                              >
                                <strong>{getRelationshipLabel(option.id)}</strong>
                                <span>{option.note}</span>
                              </button>
                            ))}
                          </div>
                          <div className="gs-home-picker-nav">
                            <button
                              type="button"
                              className="gs-secondary-btn"
                              onClick={() => goToPickerStep(0)}
                            >
                              {t("generic.back")}
                            </button>
                          </div>
                        </div>
                      </section>

                      <section
                        className="gs-home-picker-slide"
                        aria-hidden={pickerStep !== 2}
                        tabIndex={pickerStep === 2 ? 0 : -1}
                      >
                        <div className="gs-home-question gs-home-picker-panel" aria-label="Budget">
                          <div className="gs-home-picker-step-copy">
                            <span className="gs-home-step-number">02</span>
                            <div>
                              <h4>{t("picker.budgetTitle")}</h4>
                              <p>{t("picker.budgetBody")}</p>
                            </div>
                          </div>
                          <div className="gs-home-choice-grid">
                            {budgetOptions.map((option, index) => (
                              <button
                                key={option.id}
                                type="button"
                                className={classNames("gs-home-choice", brief.budget === index && "is-active")}
                                onClick={() => updateBriefAndAdvance("budget", index, 3)}
                                aria-pressed={brief.budget === index}
                              >
                                <strong>{getBudgetLabel(option.id)}</strong>
                                <span>{option.note}</span>
                              </button>
                            ))}
                          </div>
                          <div className="gs-home-picker-nav">
                            <button
                              type="button"
                              className="gs-secondary-btn"
                              onClick={() => goToPickerStep(1)}
                            >
                              {t("generic.back")}
                            </button>
                          </div>
                        </div>
                      </section>

                      <section
                        className="gs-home-picker-slide"
                        aria-hidden={pickerStep !== 3}
                        tabIndex={pickerStep === 3 ? 0 : -1}
                      >
                        <div className="gs-home-question gs-home-picker-panel" aria-label="Vibe or use case">
                          <div className="gs-home-picker-step-copy">
                            <span className="gs-home-step-number">03</span>
                            <div>
                              <h4>{t("picker.intentTitle")}</h4>
                              <p>{t("picker.intentBody")}</p>
                            </div>
                          </div>
                          <div className="gs-home-choice-grid">
                            {intentOptions.map((option, index) => (
                              <button
                                key={option.id}
                                type="button"
                                className={classNames("gs-home-choice", brief.intent === index && "is-active")}
                                onClick={() => updateBriefAndAdvance("intent", index, 4)}
                                aria-pressed={brief.intent === index}
                              >
                                <strong>{getIntentLabel(option.id)}</strong>
                                <span>{option.note}</span>
                              </button>
                            ))}
                          </div>
                          <div className="gs-home-picker-nav">
                            <button
                              type="button"
                              className="gs-secondary-btn"
                              onClick={() => goToPickerStep(2)}
                            >
                              {t("generic.back")}
                            </button>
                          </div>
                        </div>
                      </section>

                      <section
                        className="gs-home-picker-slide"
                        aria-hidden={pickerStep !== 4}
                        tabIndex={pickerStep === 4 ? 0 : -1}
                      >
                        <div className="gs-home-question is-compact gs-home-picker-panel" aria-label="Optional lane refinement">
                          <div className="gs-home-picker-step-copy">
                            <span className="gs-home-step-number">+</span>
                            <div>
                              <h4>{t("picker.signalTitle")}</h4>
                              <p>{t("picker.signalBody")}</p>
                            </div>
                          </div>
                          <div className="gs-home-compact-choice-grid">
                            {signalOptions.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                className={classNames("gs-home-choice is-compact", activeSignal.id === option.id && "is-active")}
                                onClick={() => updateSignalAndAdvance(option.id)}
                                aria-pressed={activeSignal.id === option.id}
                              >
                                <strong>{getSignalLabel(option.id)}</strong>
                              </button>
                            ))}
                          </div>
                          <div className="gs-home-picker-nav">
                            <button
                              type="button"
                              className="gs-secondary-btn"
                              onClick={() => goToPickerStep(3)}
                            >
                              {t("generic.back")}
                            </button>
                            <button
                              type="button"
                              className="gs-secondary-btn"
                              onClick={() => goToPickerStep(pickerResultStep)}
                            >
                              {t("generic.skipToGift")}
                            </button>
                          </div>
                        </div>
                      </section>

                      <section
                        className="gs-home-picker-slide"
                        aria-hidden={pickerStep !== pickerResultStep}
                        tabIndex={pickerStep === pickerResultStep ? 0 : -1}
                      >
                        <div className="gs-home-picker-panel gs-home-picker-panel-result">
                          <aside className="gs-home-result-card" aria-live="polite" aria-atomic="true">
                            <p className="gs-overline">{t("home.currentRecommendation")}</p>
                            {leadRecommendation ? (
                              <>
                                <div className="gs-home-result-head">
                                  <h4>{leadRecommendation.name}</h4>
                                  <p>{leadRecommendation.hook}</p>
                                </div>
                                <div className="gs-home-result-tags">
                                  <span>{relationshipLabel}</span>
                                  <span>{budgetLabel}</span>
                                  <span>{intentLabel}</span>
                                  <span>{signalLabel}</span>
                                </div>
                                <div className="gs-home-result-points is-condensed">
                                  <p>{leadRecommendation.why}</p>
                                  <div className="gs-home-result-mini-meta">
                                    <span>{t("home.bestFor", { value: leadRecommendation.bestFor })}</span>
                                    <span>{activeGuideChipLabel}</span>
                                  </div>
                                </div>
                                <div className="gs-home-result-actions">
                                  <a
                                    className="gs-primary-btn"
                                    href={buildAffiliateLink(leadRecommendation)}
                                    target="_blank"
                                    rel={getGiftCommerceRel(leadRecommendation)}
                                    {...getAffiliateAnchorData(leadRecommendation, "home-decision-primary")}
                                    aria-label={getGiftCommerceAriaLabel(leadRecommendation)}
                                  >
                                    {getGiftPrimaryCtaText(leadRecommendation)}
                                  </a>
                                  <a className="gs-secondary-btn" href={activeGuide.href}>
                                    {t("generic.openGuide")}
                                  </a>
                                </div>
                                <p className="gs-home-result-helper">
                                  {t("home.needSpeedInstead")}
                                </p>
                              </>
                            ) : (
                              <p className="gs-home-result-empty">{t("home.noRecommendation")}</p>
                            )}
                          </aside>
                          <div className="gs-home-picker-nav is-result">
                            <button
                              type="button"
                              className="gs-secondary-btn"
                              onClick={() => goToPickerStep(1)}
                            >
                              {t("generic.editAnswers")}
                            </button>
                            <button
                              type="button"
                              className="gs-secondary-btn"
                              onClick={() => goToPickerStep(0)}
                            >
                              {t("picker.start")}
                            </button>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>
                </section>

                <section ref={topPicksRef} className="gs-product-list">
                  <div className="gs-section-head">
                    <p className="gs-overline">{t("home.topPicksOverline")}</p>
                    <h3>{t("home.topPicksTitle")}</h3>
                  </div>
                  <p className="gs-popular-library-note">
                    {t("home.topPicksNote", {
                      relationship: relationshipLabel.toLowerCase(),
                      budget: budgetLabel.toLowerCase(),
                      intent: intentLabel.toLowerCase(),
                    })}
                  </p>
                  <div className="gs-bento-grid gs-popular-grid" role="list" aria-label={t("home.topPicksTitle")}>
                    {(weeklyTopCatalogProducts.length ? weeklyTopCatalogProducts : topPicks.slice(0, 6)).map((gift, index) =>
                      renderBentoCard(gift, index + 1, {
                        motion: "minimal",
                        imageOnly: true,
                      })
                    )}
                  </div>
                </section>
                <section className="gs-product-list">
                  <div className="gs-section-head">
                    <p className="gs-overline">{t("home.featuredOverline")}</p>
                    <h3>{t("home.featuredTitle")}</h3>
                  </div>
                  <p className="gs-popular-library-note">
                    {t("home.featuredNote")}
                  </p>
                  <div className="gs-bento-grid gs-popular-grid" role="list" aria-label="New exact product picks">
                    {featuredCatalogProducts.map((gift, index) =>
                      renderBentoCard(gift, (weeklyTopCatalogProducts.length || topPicks.length) + index + 1, {
                        motion: "minimal",
                        imageOnly: true,
                      })
                    )}
                  </div>
                </section>
                {compactBrowseProducts.length ? (
                  <section className="gs-product-list">
                    <div className="gs-section-head">
                      <p className="gs-overline">More to browse</p>
                      <h3>More popular picks</h3>
                    </div>
                    <p className="gs-popular-library-note">
                      More exact products on screen, without pushing the page into clutter.
                    </p>
                    <div className="gs-bento-grid gs-popular-grid gs-popular-grid-compact" role="list" aria-label="More popular products">
                      {compactBrowseProducts.map((gift, index) =>
                        renderBentoCard(gift, featuredCatalogProducts.length + weeklyTopCatalogProducts.length + index + 1, {
                          motion: "minimal",
                          imageOnly: true,
                        })
                      )}
                    </div>
                  </section>
                ) : null}
                <section className="gs-popular-library" aria-label="Popular page organization">
                  <div className="gs-section-head">
                    <p className="gs-overline">Keep browsing</p>
                    <h3>Shop cleaner categories</h3>
                  </div>
                  <p className="gs-popular-library-note">
                    Use exact products when one already looks right. Use the guide buckets when you want to narrow the lane first.
                  </p>
                  <div className="gs-popular-library-artband" aria-hidden="true">
                    <img
                      src="/brand-art/homepage-clusters-merch.png"
                      alt=""
                      className="gs-popular-library-art"
                      loading="lazy"
                    />
                  </div>
                  <div className="gs-popular-library-grid gs-popular-guides-grid">
                    {curatedHomepageGuideBuckets.map((bucket) => (
                      <article key={bucket.id} className="gs-popular-library-panel">
                        <div className="gs-popular-library-head">
                          <span className="gs-overline">{bucket.overline}</span>
                          <strong>{bucket.title}</strong>
                          <p>{bucket.description}</p>
                        </div>
                        <div className="gs-popular-library-list">
                          {bucket.guides.map((guide, index) => (
                            <a
                              key={guide.slug}
                              href={`/${guide.slug}/`}
                              className={classNames("gs-popular-library-link", index === 0 && "is-featured")}
                            >
                              <div>
                                <span className="gs-seo-guide-eyebrow">{index === 0 ? "Start here" : guide.groupLabel}</span>
                                <strong>{guide.label}</strong>
                              </div>
                              <ArrowUpRight size={16} />
                            </a>
                          ))}
                          <a href={bucket.allHref} className="gs-popular-library-link is-all">
                            <div>
                              <span className="gs-seo-guide-eyebrow">{t("generic.index")}</span>
                              <strong>{bucket.allLabel}</strong>
                            </div>
                            <ArrowUpRight size={16} />
                          </a>
                        </div>
                      </article>
                    ))}
                    <article className="gs-popular-library-panel is-compact-products">
                      <div className="gs-popular-library-head">
                        <span className="gs-overline">Products</span>
                        <strong>More exact product pages</strong>
                        <p>Fast paths when you already want the item, price range, and merchant route.</p>
                      </div>
                      <div className="gs-popular-library-list is-two-column">
                        {libraryProducts.slice(0, 12).map((gift) => (
                          <a key={gift.slug} href={getProductPageHref(gift.slug)} className="gs-popular-library-link">
                            <div>
                              <span className="gs-seo-guide-eyebrow">{gift.badge}</span>
                              <strong>{gift.name}</strong>
                            </div>
                            <ArrowUpRight size={16} />
                          </a>
                        ))}
                      </div>
                    </article>
                  </div>
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
              <div className="gs-slide-scroll" ref={(node) => setSlideScrollRef(1, node)}>
                <div className="gs-hot-feed-toolbar">
                  <div className="gs-parallax-copy">
                    <p className="gs-overline">{t("hot.overline")}</p>
                    <h2>{t("hot.title")}</h2>
                    <p>{t("hot.body")}</p>
                  </div>
                  <button
                    type="button"
                    className="gs-hot-refresh-btn"
                    onClick={refreshHotFeed}
                    disabled={!videoStories.length}
                  >
                    <RefreshCw size={14} />
                    <span>{t("hot.refresh")}</span>
                  </button>
                </div>
                {leadingHotFeedCycle !== null ? (
                  <section
                    className="gs-hot-feed-batch"
                    ref={(node) => setHotFeedBatchRef(leadingHotFeedCycle, node)}
                  >
                    <Masonry
                      breakpointCols={{ default: 2, 360: 1 }}
                      className="gs-masonry-grid"
                      columnClassName="gs-masonry-grid_column"
                      role="list"
                      aria-label="Hot gift stories"
                    >
                      {buildLoopedHotStories(videoStories, leadingHotFeedCycle, hotFeedRotationOffset).map((item, index) => (
                        <AnimatedHotCard key={item.instanceId} item={item} index={index} onOpenHotPreview={openHotPreview} />
                      ))}
                    </Masonry>
                  </section>
                ) : null}
                <section className="gs-seo-guide-section" aria-label="Read full hot pages">
                  <div className="gs-section-head">
                    <p className="gs-overline">{t("hot.storiesOverline")}</p>
                    <h3>{t("hot.storiesTitle")}</h3>
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
                        <span className="gs-seo-guide-eyebrow">{t("generic.index")}</span>
                        <strong>{t("hot.allPages")}</strong>
                      </div>
                      <ArrowUpRight size={16} />
                    </a>
                  </div>
                </section>
                {trailingHotFeedCycles.map((cycleIndex) => (
                  <section
                    key={`hot-feed-batch-${cycleIndex}`}
                    className="gs-hot-feed-batch"
                    ref={(node) => setHotFeedBatchRef(cycleIndex, node)}
                  >
                    <Masonry
                      breakpointCols={{ default: 2, 360: 1 }}
                      className="gs-masonry-grid"
                      columnClassName="gs-masonry-grid_column"
                      role="list"
                      aria-label={`More hot gift stories batch ${cycleIndex + 1}`}
                    >
                      {buildLoopedHotStories(videoStories, cycleIndex, hotFeedRotationOffset).map((item, index) => (
                        <AnimatedHotCard key={item.instanceId} item={item} index={index} onOpenHotPreview={openHotPreview} />
                      ))}
                    </Masonry>
                  </section>
                ))}
                <div ref={hotFeedSentinelRef} className="gs-hot-feed-sentinel" aria-hidden="true" />
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
              <div className="gs-slide-scroll" ref={(node) => setSlideScrollRef(2, node)}>
                <div className="gs-parallax-copy">
                  <p className="gs-overline">{t("plans.overline")}</p>
                  <h2>{t("plans.title")}</h2>
                  <p>{t("plans.body")}</p>
                </div>

                <section className="gs-date-shell">
                  <div className="gs-date-toolbar">
                    <div className="gs-date-area">
                      <p className="gs-overline">{t("plans.areaOverline")}</p>
                      <strong>{dateResults.areaLabel || geoState.label}</strong>
                    </div>
                    <button
                      type="button"
                      className="gs-date-locate"
                      onClick={useMyArea}
                      aria-label={t("plans.useMyAreaAria")}
                    >
                      {geoState.status === "loading" ? t("plans.locating") : t("plans.useMyArea")}
                    </button>
                  </div>

                  <div className="gs-date-search">
                    <label className="gs-date-field">
                      <span>{t("plans.party")}</span>
                      <select
                        value={dateSearch.partySize}
                        onChange={(event) => updateDateSearch("partySize", event.target.value)}
                      >
                        {datePartySizeOptions.map((partySize) => (
                          <option key={partySize} value={partySize}>
                            {partySize} {partySize === 1 ? t("date.person") : t("date.people")}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="gs-date-field is-wide">
                      <span>{t("plans.when")}</span>
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
                      href={activeDateSecondaryUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${activeDateSecondaryLabel} for ${dateResults.areaLabel || t("plans.yourArea")}`}
                    >
                      {activeDateSecondaryLabel}
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
                      <strong>{t("plans.emptyTitle")}</strong>
                      <p>{t("plans.emptyBody")}</p>
                    </article>
                  )}

                  {dateResults.spots.length > 0 ? (
                    <section className="gs-date-list" role="list" aria-label="Nearby plans">
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
                    <p className="gs-overline">{t("plans.citiesOverline")}</p>
                    <h3>{t("plans.citiesTitle")}</h3>
                  </div>
                  <div className="gs-seo-guide-list">
                    {seoDateCities.map((city) => (
                      <a key={city.slug} href={`/dates/${city.slug}/`} className="gs-seo-guide-link">
                        <div>
                          <span className="gs-seo-guide-eyebrow">{t("plans.overline")}</span>
                          <strong>{city.city}</strong>
                        </div>
                        <ArrowUpRight size={16} />
                      </a>
                    ))}
                    <a href="/dates/" className="gs-seo-guide-link is-all">
                      <div>
                        <span className="gs-seo-guide-eyebrow">{t("generic.index")}</span>
                        <strong>{t("plans.allDatePages")}</strong>
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
              <div className="gs-slide-scroll" ref={(node) => setSlideScrollRef(savedSlideIndex, node)}>
                <div className="gs-parallax-copy">
                  <p className="gs-overline">{t("saved.overline")}</p>
                  <h2>{t("saved.title")}</h2>
                  <p>{t("saved.body")}</p>
                </div>

                <section className="gs-stack">
                  {savedGifts.length ? (
                    <>
                      <section className="gs-saved-helper" role="status" aria-live="polite" aria-atomic="true">
                        <strong>{t("saved.nowCount", { count: savedGifts.length })}</strong>
                        <p>{t("saved.helper")}</p>
                      </section>
                      <div className="gs-saved-list" role="list" aria-label={t("nav.saved")}>
                        {savedGifts.map((gift, index) => renderSavedRow(gift, index))}
                      </div>
                    </>
                  ) : (
                    <div className="gs-saved-list" role="status" aria-live="polite" aria-atomic="true">
                      <article className="gs-empty-panel">
                        <p>{t("saved.empty")}</p>
                        <div className="gs-empty-actions">
                          <button type="button" className="gs-text-link-btn" onClick={() => setSlide(0)}>
                            {t("saved.openPopular")}
                          </button>
                          <button type="button" className="gs-text-link-btn" onClick={() => setSlide(1)}>
                            {t("saved.openHot")}
                          </button>
                          <button type="button" className="gs-text-link-btn" onClick={() => setSlide(2)}>
                            {t("saved.openPlans")}
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

        {previewGift && previewMode === "hot" ? (
          <div
            className="gs-hot-preview-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`preview-title-${previewGift.id}`}
            aria-describedby={`preview-description-${previewGift.id}`}
          >
            <section className="gs-hot-preview-sheet">
              <div className="gs-hot-preview-stage">
                {activePreviewMedia?.kind === "embed" && activePreviewEmbedUrl ? (
                  <iframe
                    key={activePreviewMedia.id}
                    ref={previewEmbedRef}
                    src={activePreviewEmbedUrl}
                    title={activePreviewMedia.title || `${previewGift.name} TikTok video`}
                    className="gs-hot-preview-embed"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                    onLoad={() => {
                      if (activePreviewMedia.provider !== "tiktok") {
                        return;
                      }

                      const frameWindow = previewEmbedRef.current?.contentWindow;

                      postTikTokPlayerMessage(frameWindow, "mute");
                      postTikTokPlayerMessage(frameWindow, "play");
                    }}
                  />
                ) : (
                  <div className="gs-hot-preview-fallback">
                    <p>Open the product page for the full story.</p>
                  </div>
                )}
                <div className="gs-hot-preview-topbar">
                  <button
                    ref={previewCloseRef}
                    type="button"
                    className="gs-hot-preview-close"
                    onClick={closePreview}
                    aria-label={`Close hot preview for ${previewGift.name}`}
                  >
                    Close
                  </button>
                </div>
                <div className="gs-hot-preview-scrim" aria-hidden="true" />
                <div className="gs-hot-preview-rail">
                  <p className="gs-hot-preview-kicker">Hot · TikTok</p>
                  <h3 id={`preview-title-${previewGift.id}`}>{previewGift.name}</h3>
                  <p id={`preview-description-${previewGift.id}`}>{previewGift.hook || previewGift.why}</p>
                  <div className="gs-hot-preview-meta">
                    {[activePreviewSourceLabel, activePreviewDurationLabel || previewGift.priceLabel, previewGift.badge]
                      .filter(Boolean)
                      .map((value) => (
                        <span key={`${previewGift.id}-hot-${value}`}>{value}</span>
                      ))}
                  </div>
                  <div className="gs-hot-preview-actions">
                    {previewSeoGift ? (
                      <a
                        className="gs-primary-btn"
                        href={getProductPageHref(previewSeoGift.slug)}
                        aria-label={`Open the product page for ${previewGift.name}`}
                      >
                        Open product page
                      </a>
                    ) : null}
                    <a
                      className="gs-secondary-btn gs-hot-preview-buy"
                      href={buildAffiliateLink(previewGift)}
                      target="_blank"
                      rel={getGiftCommerceRel(previewGift)}
                      {...getAffiliateAnchorData(previewGift, "hot-preview-buy")}
                      aria-label={getGiftCommerceAriaLabel(previewGift)}
                    >
                      {getGiftCommerceActionLabel(previewGift)}
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : previewGift ? (
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
                      <p>Watch the original clip in a new tab.</p>
                      {activePreviewMedia.sourceUrl ? (
                        <a
                          className="gs-primary-btn gs-preview-source-btn"
                          href={activePreviewMedia.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Watch original clip
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

                {previewHeadlineTags.length ? (
                  <div className="gs-preview-badge-row">
                    {previewHeadlineTags.map((value) => (
                      <span key={`${previewGift.id}-headline-${value}`}>{value}</span>
                    ))}
                  </div>
                ) : null}

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
                    rel={getGiftCommerceRel(previewGift)}
                    {...getAffiliateAnchorData(previewGift, "preview-primary")}
                    aria-label={getGiftCommerceAriaLabel(previewGift)}
                  >
                    {getGiftCommerceActionLabel(previewGift)}
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
                        href={getProductPageHref(previewSeoGift.slug)}
                        aria-label={`Open more details for ${previewGift.name}`}
                      >
                        Open full page
                      </a>
                    ) : null}
                  </div>
                </div>

                <p className="gs-preview-note">
                  {activePreviewMedia?.kind === "image"
                    ? "This preview is image-led."
                    : "The first click stays in the preview so you can watch first."}{" "}
                  {getGiftCommerceDisclosure(previewGift)}
                </p>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
