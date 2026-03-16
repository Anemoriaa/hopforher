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
    titleKey: "meta.default.title",
    descriptionKey: "meta.default.description",
    socialDescriptionKey: "meta.default.socialDescription",
    canonicalUrl: "https://shopforher.org/",
  },
  books: {
    titleKey: "meta.books.title",
    descriptionKey: "meta.books.description",
    socialDescriptionKey: "meta.books.socialDescription",
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
      brandHomeAria: t("books.brand.homeAria"),
      brandContext: null,
      hero: {
        overline: t("books.hero.overline"),
        title: t("books.hero.title"),
        lede: t("books.hero.lede"),
        primaryCta: t("books.hero.primaryCta"),
        secondaryCta: t("books.hero.secondaryCta"),
        summary: t("books.hero.summary", { updated: updatedLabel }),
        openHotAria: t("home.openHotAria"),
        openHotLabel: t("home.openHotLabel"),
      },
      heroProductIds: ["empyrean-box-set", "fourth-wing-kindle", "the-women-kindle"],
      decisionModule: {
        overline: t("books.module.overline"),
        title: t("books.module.title"),
        note: t("books.module.note"),
        trustChips: [
          t("books.trust.bookOnly"),
          t("home.trust.disclosed"),
          t("home.trust.updated", { updated: updatedLabel }),
        ],
      },
      pickerIntro: {
        eyebrow: t("books.pickerIntro.eyebrow"),
        title: t("books.pickerIntro.title"),
        body: t("books.pickerIntro.body"),
        buildManualLabel: t("books.pickerIntro.buildManual"),
        speedHref: "/gift/fourth-wing-kindle-edition/",
        speedLabel: t("books.pickerIntro.speedLabel"),
        quickStartAriaLabel: t("books.pickerIntro.quickStartsAria"),
      },
      quickStartLanes: [
        {
          id: "kindle-books",
          eyebrow: t("books.quickStart.kindle.eyebrow"),
          title: t("books.quickStart.kindle.title"),
          description: t("books.quickStart.kindle.description"),
          cta: t("books.quickStart.kindle.cta"),
          guideHref: "/kindle-gifts-for-her/",
          guideLabel: t("books.quickStart.kindle.guideLabel"),
          selection: {
            relationship: "wife",
            budget: "under-100",
            signal: "best-overall",
            intent: "thoughtful",
          },
        },
        {
          id: "booktok-reader",
          eyebrow: t("books.quickStart.booktok.eyebrow"),
          title: t("books.quickStart.booktok.title"),
          description: t("books.quickStart.booktok.description"),
          cta: t("books.quickStart.booktok.cta"),
          guideHref: "/booktok-gifts-for-her/",
          guideLabel: t("books.quickStart.booktok.guideLabel"),
          selection: {
            relationship: "girlfriend",
            budget: "under-100",
            signal: "best-overall",
            intent: "viral",
          },
        },
        {
          id: "visible-book-gift",
          eyebrow: t("books.quickStart.boxed.eyebrow"),
          title: t("books.quickStart.boxed.title"),
          description: t("books.quickStart.boxed.description"),
          cta: t("books.quickStart.boxed.cta"),
          guideHref: "/book-lover-gifts-for-her/",
          guideLabel: t("books.quickStart.boxed.guideLabel"),
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
          overline: t("books.section.topPicks.overline"),
          title: t("books.section.topPicks.title"),
          note: t("books.section.topPicks.note"),
        },
        featured: {
          overline: t("books.section.featured.overline"),
          title: t("books.section.featured.title"),
          note: t("books.section.featured.note"),
          ariaLabel: t("books.section.featured.aria"),
        },
        continue: {
          overline: t("books.section.continue.overline"),
          title: t("books.section.continue.title"),
          note: t("books.section.continue.note"),
          products: {
            overline: t("books.section.continue.products.overline"),
            title: t("books.section.continue.products.title"),
            body: t("books.section.continue.products.body"),
          },
          guides: {
            overline: t("books.section.continue.guides.overline"),
            title: t("books.section.continue.guides.title"),
            body: t("books.section.continue.guides.body"),
          },
          hot: {
            overline: t("books.section.continue.hot.overline"),
            title: t("books.section.continue.hot.title"),
            body: t("books.section.continue.hot.body"),
          },
        },
      },
      hotGiftIds: booksSurfaceGiftIds,
      hotGuideSlugs: booksSurfaceGuideSlugs,
      hotFeed: {
        overline: t("books.hot.overline"),
        title: t("books.hot.title"),
        body: t("books.hot.body"),
        storiesOverline: t("books.hot.storiesOverline"),
        storiesTitle: t("books.hot.storiesTitle"),
        allPagesLabel: t("books.hot.allPagesLabel"),
        allPagesHref: "/booksforher/",
      },
      topPickIds: booksSurfaceGiftIds,
      featuredProductIds: booksSurfaceGiftIds,
      libraryProductIds: booksSurfaceGiftIds,
      guideSlugs: booksSurfaceGuideSlugs,
      footerTagline: t("books.footer.tagline"),
    };
  },
};

export function getHomeSurfaceMeta(surfaceId = "default", t = (value) => value) {
  const meta = surfaceMetaById[normalizeSurfaceId(surfaceId)] || surfaceMetaById.default;

  return {
    title: t(meta.titleKey),
    description: t(meta.descriptionKey),
    socialDescription: t(meta.socialDescriptionKey),
    canonicalUrl: meta.canonicalUrl,
  };
}

export function resolveHomeSurface({ search = "", pathname = "", t, updatedLabel }) {
  const surfaceId = getSurfaceIdFromLocation({ search, pathname });
  const builder = surfaceBuilders[surfaceId] || surfaceBuilders.default;

  return builder({ t, updatedLabel });
}
