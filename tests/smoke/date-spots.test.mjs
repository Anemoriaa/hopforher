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
