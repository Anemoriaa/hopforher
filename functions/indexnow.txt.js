export function onRequestGet(context) {
  const key = String(context.env.INDEXNOW_KEY || "").trim();

  if (!key) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
      },
    });
  }

  return new Response(`${key}\n`, {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
