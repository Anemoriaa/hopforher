(function () {
  var search = new URLSearchParams(window.location.search);
  var explicitSource = (search.get("utm_source") || "").trim().toLowerCase();
  var explicitMedium = (search.get("utm_medium") || "").trim().toLowerCase();
  var campaign = (search.get("utm_campaign") || "").trim();
  var knownAiHosts = [
    "chatgpt.com",
    "chat.openai.com",
    "perplexity.ai",
    "claude.ai",
    "copilot.microsoft.com"
  ];
  var referrer = document.referrer || "";
  var referrerHost = "";

  if (referrer) {
    try {
      referrerHost = new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
    } catch (_error) {
      referrerHost = "";
    }
  }

  var inferredSource =
    explicitSource ||
    knownAiHosts.find(function (host) {
      return referrerHost === host || referrerHost.endsWith("." + host);
    }) ||
    "";

  if (!inferredSource && !campaign) {
    return;
  }

  var payload = {
    source: inferredSource || "campaign",
    medium: explicitMedium || (inferredSource ? "referral" : ""),
    campaign: campaign,
    path: window.location.pathname,
    referrer: referrer,
    referrerHost: referrerHost,
    capturedAt: new Date().toISOString()
  };
  var sessionKey = "shopforher-attribution:" + payload.source + ":" + payload.path + ":" + (payload.campaign || "");
  var latestAttributionKey = "shopforher-last-attribution";

  try {
    window.sessionStorage.setItem(latestAttributionKey, JSON.stringify({
      source: payload.source,
      medium: payload.medium,
      campaign: payload.campaign,
      referrerHost: payload.referrerHost,
      path: payload.path,
      capturedAt: payload.capturedAt
    }));

    if (window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    window.sessionStorage.setItem(sessionKey, "1");
  } catch (_storageError) {
    // Ignore storage failures and continue with a best-effort send.
  }

  var body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/attribution", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/attribution", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: body,
    keepalive: true
  }).catch(function () {
    // Best-effort analytics hook only.
  });
})();
