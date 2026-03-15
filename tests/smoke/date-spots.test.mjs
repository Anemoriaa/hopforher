import assert from "node:assert/strict";
import test from "node:test";
import { onRequestGet } from "../../functions/api/date-spots.js";

test("OpenTable requests without coordinates fall back before upstream fetch", async (t) => {
  const originalFetch = global.fetch;
  let fetchCalls = 0;

  global.fetch = async () => {
    fetchCalls += 1;
    throw new Error("upstream fetch should not run without coordinates");
  };

  t.after(() => {
    global.fetch = originalFetch;
  });

  const response = await onRequestGet({
    request: new Request("https://example.com/api/date-spots?partySize=2.7&limit=3.2"),
    env: {
      DATE_SPOTS_PROVIDER: "opentable",
      OPENTABLE_DIRECTORY_API_URL: "https://opentable.example/search",
    },
  });

  const body = await response.json();

  assert.equal(fetchCalls, 0);
  assert.equal(response.status, 200);
  assert.equal(body.provider, "opentable");
  assert.equal(body.mode, "idle");
  assert.ok(Array.isArray(body.spots));
  assert.ok(body.spots.length > 0);
});

test("OpenTable requests round party size and limit before upstream fetch", async (t) => {
  const originalFetch = global.fetch;
  let requestedUrl = null;

  global.fetch = async (resource) => {
    requestedUrl = new URL(String(resource));

    return new Response(JSON.stringify({ spots: [] }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
  };

  t.after(() => {
    global.fetch = originalFetch;
  });

  const response = await onRequestGet({
    request: new Request(
      "https://example.com/api/date-spots?latitude=34.05&longitude=-118.24&partySize=2.7&limit=3.2&dateTime=2026-03-11T19:00"
    ),
    env: {
      DATE_SPOTS_PROVIDER: "opentable",
      OPENTABLE_DIRECTORY_API_URL: "https://opentable.example/search",
    },
  });

  const body = await response.json();

  assert.ok(requestedUrl, "expected upstream request URL");
  assert.equal(requestedUrl.searchParams.get("partySize"), "3");
  assert.equal(requestedUrl.searchParams.get("limit"), "3");
  assert.equal(body.provider, "opentable");
  assert.equal(body.mode, "live");
  assert.deepEqual(body.spots, []);
});

test("OpenTable requests with out-of-range coordinates fall back before upstream fetch", async (t) => {
  const originalFetch = global.fetch;
  let fetchCalls = 0;

  global.fetch = async () => {
    fetchCalls += 1;
    throw new Error("upstream fetch should not run with invalid coordinates");
  };

  t.after(() => {
    global.fetch = originalFetch;
  });

  const response = await onRequestGet({
    request: new Request("https://example.com/api/date-spots?latitude=999&longitude=-118.24"),
    env: {
      DATE_SPOTS_PROVIDER: "opentable",
      OPENTABLE_DIRECTORY_API_URL: "https://opentable.example/search",
    },
  });

  const body = await response.json();

  assert.equal(fetchCalls, 0);
  assert.equal(response.status, 200);
  assert.equal(body.provider, "opentable");
  assert.equal(body.mode, "idle");
  assert.ok(Array.isArray(body.spots));
  assert.ok(body.spots.length > 0);
});

test("Google Places requests ignore malformed Accept-Language tokens before forwarding languageCode", async (t) => {
  const originalFetch = global.fetch;
  let requestedBody = null;

  global.fetch = async (_resource, options) => {
    requestedBody = JSON.parse(options.body);

    return new Response(
      JSON.stringify({
        places: [
          {
            id: "demo-place",
            displayName: { text: "Cafe Demo" },
            formattedAddress: "123 Main St, Los Angeles, CA 90012",
            shortFormattedAddress: "Main St, Los Angeles",
            location: { latitude: 34.05, longitude: -118.24 },
            googleMapsUri: "https://maps.google.com/?q=demo-place",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );
  };

  t.after(() => {
    global.fetch = originalFetch;
  });

  const response = await onRequestGet({
    request: new Request("https://example.com/api/date-spots?latitude=34.05&longitude=-118.24&limit=1", {
      headers: {
        "accept-language": "*,es-ES;q=0.9,en-US;q=0.8",
      },
    }),
    env: {
      GOOGLE_PLACES_API_KEY: "demo-key",
    },
  });

  const body = await response.json();

  assert.ok(requestedBody, "expected Google Places request body");
  assert.equal(requestedBody.languageCode, "es-ES");
  assert.equal(body.provider, "google-places");
  assert.equal(body.mode, "live");
  assert.equal(body.spots.length, 1);
});

test("Google Places requests with out-of-range coordinates do not hit upstream", async (t) => {
  const originalFetch = global.fetch;
  let fetchCalls = 0;

  global.fetch = async () => {
    fetchCalls += 1;
    throw new Error("upstream fetch should not run with invalid coordinates");
  };

  t.after(() => {
    global.fetch = originalFetch;
  });

  const response = await onRequestGet({
    request: new Request("https://example.com/api/date-spots?latitude=34.05&longitude=-999"),
    env: {
      GOOGLE_PLACES_API_KEY: "demo-key",
    },
  });

  const body = await response.json();

  assert.equal(fetchCalls, 0);
  assert.equal(response.status, 200);
  assert.equal(body.provider, "google-places");
  assert.equal(body.mode, "idle");
  assert.ok(Array.isArray(body.spots));
  assert.ok(body.spots.length > 0);
});

test("Google Places requests fall back to en when the explicit language override is invalid", async (t) => {
  const originalFetch = global.fetch;
  let requestedBody = null;

  global.fetch = async (_resource, options) => {
    requestedBody = JSON.parse(options.body);

    return new Response(JSON.stringify({ places: [] }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
  };

  t.after(() => {
    global.fetch = originalFetch;
  });

  await onRequestGet({
    request: new Request("https://example.com/api/date-spots?latitude=34.05&longitude=-118.24&limit=1"),
    env: {
      GOOGLE_PLACES_API_KEY: "demo-key",
      GOOGLE_PLACES_LANGUAGE_CODE: "*",
    },
  });

  assert.ok(requestedBody, "expected Google Places request body");
  assert.equal(requestedBody.languageCode, "en");
});

test("Google Places requests normalize valid region overrides and drop invalid ones", async (t) => {
  const originalFetch = global.fetch;
  const requestedBodies = [];

  global.fetch = async (_resource, options) => {
    requestedBodies.push(JSON.parse(options.body));

    return new Response(
      JSON.stringify({
        places: [
          {
            id: `demo-place-${requestedBodies.length}`,
            displayName: { text: "Cafe Demo" },
            formattedAddress: "123 Main St, Los Angeles, CA 90012",
            shortFormattedAddress: "Main St, Los Angeles",
            location: { latitude: 34.05, longitude: -118.24 },
            googleMapsUri: "https://maps.google.com/?q=demo-place",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );
  };

  t.after(() => {
    global.fetch = originalFetch;
  });

  await onRequestGet({
    request: new Request("https://example.com/api/date-spots?latitude=34.05&longitude=-118.24&limit=1"),
    env: {
      GOOGLE_PLACES_API_KEY: "demo-key",
      GOOGLE_PLACES_REGION_CODE: "mx",
    },
  });

  await onRequestGet({
    request: new Request("https://example.com/api/date-spots?latitude=34.05&longitude=-118.24&limit=1"),
    env: {
      GOOGLE_PLACES_API_KEY: "demo-key",
      GOOGLE_PLACES_REGION_CODE: "usa",
    },
  });

  assert.equal(requestedBodies.length, 2);
  assert.equal(requestedBodies[0].regionCode, "MX");
  assert.equal("regionCode" in requestedBodies[1], false);
});
