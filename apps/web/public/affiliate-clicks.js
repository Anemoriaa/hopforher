(function () {
  var attributionStorageKey = "shopforher-last-attribution";

  function safeJsonParse(value) {
    try {
      return JSON.parse(value || "{}");
    } catch (_error) {
      return {};
    }
  }

  function safeHost(value) {
    if (!value) {
      return "";
    }

    try {
      return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    } catch (_error) {
      return "";
    }
  }

  function safeUrl(value) {
    try {
      return new URL(value, window.location.href);
    } catch (_error) {
      return null;
    }
  }

  function extractAmazonAsin(url) {
    if (!url) {
      return "";
    }

    var match = url.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:[/?]|$)/i);
    return match ? match[1].toUpperCase() : "";
  }

  function readAttributionContext() {
    try {
      return safeJsonParse(window.sessionStorage.getItem(attributionStorageKey));
    } catch (_error) {
      return {};
    }
  }

  function buildPayload(anchor) {
    var url = safeUrl(anchor.href);

    if (!url) {
      return null;
    }

    var attribution = readAttributionContext();
    var label = (anchor.dataset.affiliateLabel || anchor.textContent || "").trim().replace(/\s+/g, " ");

    return {
      merchant: anchor.dataset.affiliateMerchant || "Amazon",
      placement: anchor.dataset.affiliatePlacement || "",
      productId: anchor.dataset.affiliateProductId || "",
      productSlug: anchor.dataset.affiliateProductSlug || "",
      productName: anchor.dataset.affiliateProductName || "",
      asin: anchor.dataset.affiliateAsin || extractAmazonAsin(url),
      tag: url.searchParams.get("tag") || "",
      buttonLabel: label.slice(0, 80),
      pageTitle: (document.title || "").slice(0, 160),
      path: window.location.pathname,
      destination: url.toString(),
      referrer: document.referrer || "",
      referrerHost: attribution.referrerHost || "",
      source: attribution.source || "",
      medium: attribution.medium || "",
      campaign: attribution.campaign || "",
      capturedAt: new Date().toISOString()
    };
  }

  function sendPayload(payload) {
    var body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/affiliate-click", new Blob([body], { type: "application/json" }));
      return;
    }

    fetch("/api/affiliate-click", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: body,
      keepalive: true
    }).catch(function () {
      // Best-effort analytics hook only.
    });
  }

  document.addEventListener("click", function (event) {
    var anchor = event.target && event.target.closest ? event.target.closest("a[data-affiliate-link]") : null;

    if (!anchor) {
      return;
    }

    var payload = buildPayload(anchor);

    if (!payload) {
      return;
    }

    sendPayload(payload);
  }, true);
})();
