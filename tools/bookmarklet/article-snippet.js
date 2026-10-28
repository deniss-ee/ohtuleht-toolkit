// Article snippet bookmarklet (v2). Runs on an ohtuleht.ee article page and copies one JSON snippet
// for the banner generator: { url, title, image, badge }.
// The generator turns this file into the "javascript:" bookmark (comment lines and extra spaces are removed).
// Keep it free of regex literals and of strings with double spaces.
(function () {
  var meta = function (selector) {
    var el = document.querySelector(selector);
    return el && el.content ? el.content.trim() : "";
  };
  var id = (location.pathname.match(/\/(\d{6,})/) || [])[1];
  var snippet = JSON.stringify({
    url: id ? "https://www.ohtuleht.ee/" + id + "/" : meta('meta[property="og:url"]') || location.href,
    title: meta('meta[property="og:title"]') || document.title,
    image: meta('meta[property="og:image"]').replace("/59/", "/54/"),
    badge: meta('meta[name="articleSection"]'),
  });
  var say = function (text) {
    var box = document.createElement("div");
    box.textContent = text;
    box.style.cssText = "position:fixed;z-index:2147483647;right:16px;bottom:16px;max-width:320px;padding:12px 16px;border-radius:8px;background:#111;color:#fff;font:14px/1.4 sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.3)";
    document.body.appendChild(box);
    setTimeout(function () {
      box.remove();
    }, 2500);
  };
  var fallback = function () {
    prompt("Copy this snippet (Ctrl+C):", snippet);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(snippet).then(function () {
      say("Copied: " + JSON.parse(snippet).title);
    }, fallback);
  } else {
    fallback();
  }
})();
