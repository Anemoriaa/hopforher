import {
  affiliateConfig as baseAffiliateConfig,
  tabs as baseTabs,
} from "../../../../packages/catalog/index.js";
import {
  getCatalogSnapshot,
  subscribeToCatalogUpdates,
} from "../../../../packages/catalog/storage.js";

export function readLiveCatalog() {
  const snapshot = getCatalogSnapshot();

  return {
    affiliateConfig: snapshot.affiliateConfig || baseAffiliateConfig,
    tabs: snapshot.tabs?.length ? snapshot.tabs : baseTabs,
    gifts: snapshot.gifts || [],
  };
}

export { subscribeToCatalogUpdates };

export const controls = {
  relationship: [
    { id: "girlfriend", label: "Girlfriend" },
    { id: "wife", label: "Wife" },
    { id: "anniversary", label: "Anniversary" },
    { id: "new-relationship", label: "New relationship" },
    { id: "anyone", label: "Anyone" },
  ],
  budget: [
    { id: "under-50", label: "Under $50" },
    { id: "under-100", label: "Under $100" },
    { id: "premium", label: "Premium" },
    { id: "any-price", label: "Any price" },
  ],
  intent: [
    { id: "thoughtful", label: "Thoughtful" },
    { id: "looks-expensive", label: "Looks expensive" },
    { id: "cozy", label: "Cozy home" },
    { id: "everyday", label: "Everyday win" },
    { id: "viral", label: "Viral now" },
  ],
};

export const groupLabels = {
  relationship: "Relationship",
  budget: "Budget",
  intent: "Angle",
};

export const stateLabels = {
  girlfriend: "Girlfriend",
  wife: "Wife",
  anniversary: "Anniversary",
  "new-relationship": "New relationship",
  anyone: "Anyone",
  "under-50": "Under $50",
  "under-100": "Under $100",
  premium: "Premium",
  "any-price": "Any price",
  thoughtful: "Thoughtful",
  "looks-expensive": "Looks expensive",
  cozy: "Cozy home",
  everyday: "Everyday win",
  viral: "Viral",
};

export const presets = [
  {
    id: "anniversary-lock",
    label: "Anniversary lock",
    note: "More signal, less risk",
    updates: { relationship: "anniversary", tab: "looks-expensive", intent: "thoughtful" },
  },
  {
    id: "under-100",
    label: "Under $100",
    note: "Looks stronger than price",
    updates: { budget: "under-100", tab: "best-overall", intent: "looks-expensive" },
  },
  {
    id: "cozy-home",
    label: "Cozy home",
    note: "Used again, not once",
    updates: { tab: "cozy-home", intent: "cozy" },
  },
  {
    id: "daily-win",
    label: "Daily win",
    note: "Good gift, easy yes",
    updates: { tab: "daily-use", intent: "everyday" },
  },
];

export const defaultFilters = {
  tab: "best-overall",
  relationship: "wife",
  budget: "under-100",
  intent: "thoughtful",
  search: "",
};

const storageKey = "giftsher-shortlist";

export function loadSaved() {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

export function persistSaved(nextSaved) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(nextSaved));
  } catch (error) {
    return;
  }
}

export function buildAffiliateLink(gift) {
  const liveAffiliateConfig = readLiveCatalog().affiliateConfig || baseAffiliateConfig;
  const url = new URL(liveAffiliateConfig.baseUrl);
  url.searchParams.set("k", gift.query);
  url.searchParams.set("tag", liveAffiliateConfig.tag);
  return url.toString();
}

export function matchesBudget(gift, budget) {
  if (budget === "under-50") return gift.priceValue <= 50;
  if (budget === "under-100") return gift.priceValue <= 100;
  if (budget === "premium") return gift.priceValue > 100;
  return true;
}

export function matchesSearch(gift, search) {
  if (!search) return true;

  const query = search.toLowerCase().trim();
  const haystack = [
    gift.name,
    gift.badge,
    gift.hook,
    gift.why,
    gift.bestFor,
    gift.vibe,
    gift.priceLabel,
    ...(gift.relationships || []),
    ...(gift.intents || []),
    ...(gift.tabs || []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function scoreGift(gift, filters) {
  let score = gift.baseScore;

  if (gift.relationships.includes(filters.relationship)) score += 30;
  if (filters.relationship === "anyone") score += 12;

  if (gift.intents.includes(filters.intent)) score += 26;
  if (gift.tabs.includes(filters.tab)) score += 18;

  if (filters.budget === "under-50") score += gift.priceValue <= 50 ? 26 : -12;
  if (filters.budget === "under-100") score += gift.priceValue <= 100 ? 20 : -8;
  if (filters.budget === "premium") score += gift.priceValue > 100 ? 16 : -6;
  if (filters.budget === "any-price") score += 8;

  return score;
}

export function rankVisibleGifts(filters, catalogGifts) {
  const sourceGifts = catalogGifts || readLiveCatalog().gifts;

  const byTabBudgetSearch = sourceGifts.filter(
    (gift) =>
      gift.tabs.includes(filters.tab) &&
      matchesBudget(gift, filters.budget) &&
      matchesSearch(gift, filters.search)
  );

  const byTabSearch = sourceGifts.filter(
    (gift) => gift.tabs.includes(filters.tab) && matchesSearch(gift, filters.search)
  );

  const searchOnly = sourceGifts.filter((gift) => matchesSearch(gift, filters.search));
  const byTabAndBudget = sourceGifts.filter(
    (gift) => gift.tabs.includes(filters.tab) && matchesBudget(gift, filters.budget)
  );
  const byTab = sourceGifts.filter((gift) => gift.tabs.includes(filters.tab));

  let source = [];

  if (filters.search) {
    source = byTabBudgetSearch.length
      ? byTabBudgetSearch
      : byTabSearch.length
        ? byTabSearch
        : searchOnly.length
          ? searchOnly
          : [];
  } else {
    source = byTabAndBudget.length ? byTabAndBudget : byTab.length ? byTab : [];
  }

  return [...source].sort((a, b) => scoreGift(b, filters) - scoreGift(a, filters));
}

export function getBudgetReadout(gift, budget) {
  if (budget === "any-price") return "Flexible";
  if (budget === "premium") return gift.priceValue > 100 ? "Premium fit" : "Below target";
  if (budget === "under-100") return gift.priceValue <= 100 ? "On budget" : "Small stretch";
  return gift.priceValue <= 50 ? "On budget" : "Over budget";
}

export function getUseSignal(gift) {
  if (gift.intents.includes("everyday")) return "Daily use";
  if (gift.intents.includes("cozy")) return "At-home";
  if (gift.intents.includes("looks-expensive")) return "Impression";
  return "General hit";
}

export function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}
