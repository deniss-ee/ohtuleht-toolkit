// Article scraper bookmark (marketing). Runs on an ohtuleht.ee article page, reads title, lead text,
// article link and picture link, and opens the toolkit page that shows them with Copy buttons.
// "__APP__" is replaced by the address of the toolkit when the bookmark is built (see lib/bookmarklet.ts).
// Keep it free of regex literals and of strings with double spaces: the conversion collapses whitespace.
(function () {
  var pick = function (selectors) {
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      var v = el && (el.content || el.href);
      if (v) return v.trim();
    }
    return "";
  };
  // The article number is the first path part of 6 or more digits.
  var parts = location.pathname.split("/");
  var id = "";
  for (var i = 0; i < parts.length; i++) {
    if (parts[i].length >= 6 && String(Number(parts[i])) === parts[i]) {
      id = parts[i];
      break;
    }
  }
  var lead = document.querySelector(".article-main--content.article-main--excerpt.formatted--content p");
  var data = {
    t: pick(['meta[property="og:title"]', 'meta[name="twitter:title"]']) || document.title.trim(),
    l: lead ? lead.textContent.trim() : "",
    u: id ? "https://www.ohtuleht.ee/" + id + "/" : pick(['meta[property="og:url"]', 'link[rel="canonical"]']) || location.href,
    i: pick(['meta[property="og:image"]', 'meta[name="twitter:image"]']).replace(new RegExp("/(webp/)?[0-9]{1,3}/(?=i/)"), "/webp/54/"),
    b: pick(['meta[name="articleSection"]']),
  };
  // Text to URL-safe base64 (works with Estonian letters).
  var code = btoa(unescape(encodeURIComponent(JSON.stringify(data)))).split("+").join("-").split("/").join("_").split("=").join("");
  if (!window.open("__APP__?section=tools&tool=article-scraper#a=" + code, "_blank")) {
    alert("The browser blocked the new tab. Allow pop-ups for ohtuleht.ee and click the bookmark again.");
  }
})();
