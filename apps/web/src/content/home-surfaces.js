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
    title: "BooksForHer | Reader gifts for her, bought fast",
    description: "Kindle, cozy reader gifts, and reading-first picks for men buying for her.",
    socialDescription: "Reader-safe Kindle gifts, cozy reading upgrades, and cleaner bookish picks for her.",
    canonicalUrl: "https://shopforher.org/booksforher/",
  },
};

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
      topPickIds: [],
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
        overline: "Reading lane",
        title: "Book gifts for her, without the generic book blog feel.",
        lede: "Same fast-buying shell, retuned for Kindle, boxed sets, and cozy reading upgrades that still feel clearly chosen.",
        primaryCta: "Start with reader-safe picks",
        secondaryCta: "See the shortlist",
        summary: `Reading-first picks inside ShopForHer. Updated ${updatedLabel}.`,
        openHotAria: t("home.openHotAria"),
        openHotLabel: t("home.openHotLabel"),
      },
      heroProductIds: ["kindle-paperwhite", "luxury-throw", "candle-warmer"],
      decisionModule: {
        overline: "Reader picker",
        title: "Relationship, budget, mood. Build the reading version.",
        note: "Fast lane or manual.",
        trustChips: ["Reader-safe picks", "Paid links disclosed", `Updated ${updatedLabel}`],
      },
      pickerIntro: {
        eyebrow: "Start with reading",
        title: "Three quicker lanes for reader gifts.",
        body: "Use the same shell, but start with Kindle, cozy reading, or the broader book-lover angle.",
        buildManualLabel: "Use the full picker",
        speedHref: "/gift/kindle-paperwhite-signature-edition/",
        speedLabel: "Need speed? Kindle page",
        quickStartAriaLabel: "Reading quick starts",
      },
      quickStartLanes: [
        {
          id: "reader-upgrade",
          eyebrow: "Reader upgrade",
          title: "Kindle-first",
          description: "Clean device gift, low clutter, stronger daily payoff.",
          cta: "Use",
          guideHref: "/kindle-gifts-for-her/",
          guideLabel: "Kindle guide",
          selection: {
            relationship: "wife",
            budget: "premium",
            signal: "best-overall",
            intent: "thoughtful",
          },
        },
        {
          id: "cozy-reader",
          eyebrow: "Cozy lane",
          title: "Night reader",
          description: "Soft add-ons around the reading ritual instead of another generic gift.",
          cta: "Use",
          guideHref: "/cozy-gifts-for-readers/",
          guideLabel: "Cozy reader guide",
          selection: {
            relationship: "girlfriend",
            budget: "under-100",
            signal: "cozy-home",
            intent: "cozy",
          },
        },
        {
          id: "book-lover",
          eyebrow: "Reader identity",
          title: "Book lover",
          description: "Broader bookish lane when the reading identity matters more than the exact format.",
          cta: "Use",
          guideHref: "/book-lover-gifts-for-her/",
          guideLabel: "Book-lover guide",
          selection: {
            relationship: "girlfriend",
            budget: "under-100",
            signal: "daily-use",
            intent: "everyday",
          },
        },
      ],
      sections: {
        topPicks: {
          overline: "Reading picks",
          title: "Reader-safe shortlist",
          note: "Kindle, quiet upgrades, and calmer at-home gifts that fit a reading-first angle.",
        },
        featured: {
          overline: "Exact picks",
          title: "Reader-ready product pages",
          note: "Direct product pages for the clearest reading-adjacent buys instead of generic roundup filler.",
          ariaLabel: "Reader-ready product pages",
        },
        continue: {
          overline: "Keep going",
          title: "Stay inside the reading lane",
          note: "Open exact product pages when one buy already feels right. Open broader guides when the gift still needs more context.",
          products: {
            overline: "Products",
            title: "Reading pages",
            body: "Best when the gift is a device or a clear ritual add-on.",
          },
          guides: {
            overline: "Guides",
            title: "Supporting guides",
            body: "Use these when the bookish angle still needs a Kindle, cozy, budget, or relationship frame.",
          },
          hot: {
            overline: "Hot",
            title: "Current angles",
            body: "Open faster-moving lanes when you want current proof before the evergreen reading pick.",
          },
        },
      },
      topPickIds: ["kindle-paperwhite", "luxury-throw", "candle-warmer", "sunrise-alarm", "temperature-mug", "bose-speaker"],
      featuredProductIds: ["kindle-paperwhite", "candle-warmer", "luxury-throw", "sunrise-alarm", "temperature-mug", "bose-speaker"],
      libraryProductIds: ["kindle-paperwhite", "candle-warmer", "luxury-throw", "sunrise-alarm", "temperature-mug", "bose-speaker"],
      guideSlugs: ["books-for-her", "kindle-gifts-for-her", "cozy-gifts-for-readers", "book-lover-gifts-for-her", "best-gifts-under-100", "gifts-for-wife"],
      footerTagline: "Reading-first gift picks for men buying for her.",
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
