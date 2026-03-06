import "./gifts.js";

const catalog = window.GiftsherCatalog || {
  affiliateConfig: {
    baseUrl: "https://www.amazon.com/s",
    merchantName: "Amazon",
    tag: "giftsher-20",
  },
  tabs: [],
  gifts: [],
};

export const affiliateConfig = catalog.affiliateConfig;
export const tabs = catalog.tabs;
export const gifts = catalog.gifts;

export default catalog;
