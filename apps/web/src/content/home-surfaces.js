function normalizeSurfaceId(value) {
  if (typeof value !== "string") {
    return "default";
  }

  return value.trim().toLowerCase() || "default";
}

function getSurfaceIdFromLocation({ search = "", pathname = "" } = {}) {
  try {
    const params = new URLSearchParams(search);
    const querySurface = normalizeSurfaceId(params.get("surface"));

    if (querySurface !== "default") {
      return querySurface;
    }
  } catch {
    // Ignore malformed search strings and fall back to path/default handling.
  }

  if (pathname.startsWith("/booksforher")) {
    return "books";
  }

  return "default";
}

const surfaceMetaById = {
  default: {
    title: "ShopForHer | Popular gifts for her, bought fast",
    description: "ShopForHer helps men buy the right gift for a girlfriend or wife fast, with popular picks, viral products, and simple date ideas.",
    socialDescription: "Popular gifts, viral picks, and simple date ideas for men buying for her.",
    canonicalUrl: "https://shopforher.org/",
  },
  books: {
    title: "BooksForHer | Book gifts for her, bought fast",
    description: "BooksForHer helps men buy actual books, Kindle editions, and boxed-set picks for her fast.",
    socialDescription: "Actual books, Kindle editions, and cleaner bookish picks for her.",
    canonicalUrl: "https://shopforher.org/booksforher/",
  },
};

export const booksSurfaceGiftIds = [
  "fourth-wing-kindle",
  "the-women-kindle",
  "the-wedding-people-kindle",
  "acotar-kindle",
  "empyrean-box-set",
];

export const booksSurfaceGuideSlugs = [
  "books-for-her",
  "kindle-gifts-for-her",
  "cozy-gifts-for-readers",
  "book-lover-gifts-for-her",
  "booktok-gifts-for-her",
];

const booksSurfaceGiftIdSet = new Set(booksSurfaceGiftIds);

export function isBooksSurfaceGiftId(giftId) {
  return typeof giftId === "string" && booksSurfaceGiftIdSet.has(giftId);
}

export function filterCatalogGiftsForSurface(catalogGifts, surfaceId = "default") {
  if (!Array.isArray(catalogGifts)) {
    return [];
  }

  return catalogGifts.filter((gift) =>
    normalizeSurfaceId(surfaceId) === "books"
      ? isBooksSurfaceGiftId(gift?.id)
      : !isBooksSurfaceGiftId(gift?.id)
  );
}

const surfaceBuilders = {
  default({ t, updatedLabel }) {
    return {
      id: "default",
      appClassName: "",
      brandHref: "/",
      brandHomeAria: t("brand.homeAria"),
      brandContext: null,
      hero: {
        overline: t("home.overline"),
        title: t("home.title"),
        lede: t("home.lede"),
        primaryCta: t("home.startPicker"),
        secondaryCta: t("home.seeMostBought"),
        summary: t("home.summary", { updated: updatedLabel }),
        openHotAria: t("home.openHotAria"),
        openHotLabel: t("home.openHotLabel"),
      },
      heroProductIds: [],
      decisionModule: null,
      pickerIntro: null,
      quickStartLanes: null,
      sections: null,
      topPickIds: [
        "silk-pillowcase",
        "digital-frame",
        "ninja-creami",
        "owala-bottle",
        "laneige-set",
        "candle-warmer",
      ],
      featuredProductIds: [],
      libraryProductIds: [],
      guideSlugs: [],
      footerTagline: "",
    };
  },
  books({ t, updatedLabel }) {
    return {
      id: "books",
      appClassName: "surface-books",
      brandHref: "/booksforher/",
      brandHomeAria: "BooksForHer home",
      brandContext: null,
      hero: {
        overline: "Books lane",
        title: "Book gifts for her, tuned to real books and Kindle editions.",
        lede: "Same fast-buying shell, rebuilt around Kindle editions, current fiction picks, and one obvious boxed-set move.",
        primaryCta: "Start with book picks",
        secondaryCta: "See the shortlist",
        summary: `Book-first picks inside ShopForHer. Updated ${updatedLabel}.`,
        openHotAria: t("home.openHotAria"),
        openHotLabel: t("home.openHotLabel"),
      },
      heroProductIds: ["empyrean-box-set", "fourth-wing-kindle", "the-women-kindle"],
      decisionModule: {
        overline: "Book picker",
        title: "Relationship, budget, mood. Build the book version.",
        note: "Kindle edition or boxed set.",
        trustChips: ["Book-only picks", "Paid links disclosed", `Updated ${updatedLabel}`],
      },
      pickerIntro: {
        eyebrow: "Start with books",
        title: "Three quicker lanes for book gifts.",
        body: "Use the same shell, but start with Kindle editions, BookTok fiction, or the stronger boxed-set move.",
        buildManualLabel: "Use the full picker",
        speedHref: "/gift/fourth-wing-kindle-edition/",
        speedLabel: "Need speed? Fourth Wing page",
        quickStartAriaLabel: "Book quick starts",
      },
      quickStartLanes: [
        {
          id: "kindle-books",
          eyebrow: "Kindle lane",
          title: "Kindle-first fiction",
          description: "Faster Kindle-edition picks when you want one book she can open immediately.",
          cta: "Use",
          guideHref: "/kindle-gifts-for-her/",
          guideLabel: "Kindle books guide",
          selection: {
            relationship: "wife",
            budget: "under-100",
            signal: "best-overall",
            intent: "thoughtful",
          },
        },
        {
          id: "booktok-reader",
          eyebrow: "Current lane",
          title: "BookTok fiction",
          description: "Current fantasy and fiction picks when online proof matters as much as the gift itself.",
          cta: "Use",
          guideHref: "/booktok-gifts-for-her/",
          guideLabel: "BookTok guide",
          selection: {
            relationship: "girlfriend",
            budget: "under-100",
            signal: "best-overall",
            intent: "viral",
          },
        },
        {
          id: "visible-book-gift",
          eyebrow: "Visible gift",
          title: "Boxed set",
          description: "The clearer move when you want a physical stack that still fits the same bookish lane.",
          cta: "Use",
          guideHref: "/book-lover-gifts-for-her/",
          guideLabel: "Book-lover guide",
          selection: {
            relationship: "girlfriend",
            budget: "under-100",
            signal: "looks-expensive",
            intent: "thoughtful",
          },
        },
      ],
      sections: {
        topPicks: {
          overline: "Book picks",
          title: "Book-first shortlist",
          note: "Kindle editions and one stronger boxed set instead of reader-adjacent accessories.",
        },
        featured: {
          overline: "Exact picks",
          title: "Book-ready product pages",
          note: "Direct product pages for exact books and Kindle editions instead of broader reader-setup filler.",
          ariaLabel: "Book-ready product pages",
        },
        continue: {
          overline: "Keep going",
          title: "Stay inside the book lane",
          note: "Open exact product pages when one title already feels right. Open broader guides when the book choice still needs more context.",
          products: {
            overline: "Products",
            title: "Book pages",
            body: "Best when one exact Kindle edition or boxed set already feels right.",
          },
          guides: {
            overline: "Guides",
            title: "Supporting guides",
            body: "Use these when the bookish angle still needs a Kindle, BookTok, cozy-read, or relationship frame.",
          },
          hot: {
            overline: "Hot",
            title: "Current angles",
            body: "Stay inside book previews and bookish pages instead of drifting into the full gift catalog.",
          },
        },
      },
      hotGiftIds: booksSurfaceGiftIds,
      hotGuideSlugs: booksSurfaceGuideSlugs,
      hotFeed: {
        overline: "Hot",
        title: "Book previews and faster bookish angles.",
        body: "Open the book preview first, then move into the matching books page.",
        storiesOverline: "Book guides",
        storiesTitle: "Read the books pages",
        allPagesLabel: "BooksForHer home",
        allPagesHref: "/booksforher/",
      },
      topPickIds: booksSurfaceGiftIds,
      featuredProductIds: booksSurfaceGiftIds,
      libraryProductIds: booksSurfaceGiftIds,
      guideSlugs: booksSurfaceGuideSlugs,
      footerTagline: "Book-first gift picks for men buying for her.",
    };
  },
};

export function getHomeSurfaceMeta(surfaceId = "default") {
  return surfaceMetaById[normalizeSurfaceId(surfaceId)] || surfaceMetaById.default;
}

export function resolveHomeSurface({ search = "", pathname = "", t, updatedLabel }) {
  const surfaceId = getSurfaceIdFromLocation({ search, pathname });
  const builder = surfaceBuilders[surfaceId] || surfaceBuilders.default;

  return builder({ t, updatedLabel });
}
