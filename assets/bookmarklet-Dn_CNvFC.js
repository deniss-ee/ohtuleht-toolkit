var e=`// Article snippet bookmarklet (v2). Runs on an ohtuleht.ee article page and copies one JSON snippet
// for the banner generator: { url, title, image, badge }.
// The generator turns this file into the "javascript:" bookmark (comment lines and extra spaces are removed).
// Keep it free of regex literals and of strings with double spaces.
(function () {
  var meta = function (selector) {
    var el = document.querySelector(selector);
    return el && el.content ? el.content.trim() : "";
  };
  var id = (location.pathname.match(/\\/(\\d{6,})/) || [])[1];
  var snippet = JSON.stringify({
    url: id ? "https://www.ohtuleht.ee/" + id + "/" : meta('meta[property="og:url"]') || location.href,
    title: meta('meta[property="og:title"]') || document.title,
    image: meta('meta[property="og:image"]').replace("/59/", "/54/"),
    badge: meta('meta[name="articleSection"]'),
  });
  // Big green card in the middle of the top edge: hard to miss. Click it to close.
  var say = function (title) {
    var box = document.createElement("div");
    box.style.cssText = "position:fixed;z-index:2147483647;top:24px;left:50%;transform:translateX(-50%);width:min(520px,calc(100% - 32px));padding:20px 24px;border-radius:12px;background:#15803d;color:#fff;font:16px/1.4 sans-serif;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.45);cursor:pointer";
    var line = function (text, css) {
      var el = document.createElement("div");
      el.textContent = text;
      el.style.cssText = css;
      box.appendChild(el);
    };
    line("✓ Article copied!", "font-size:26px;font-weight:700;margin-bottom:6px");
    line(title, "opacity:.9;margin-bottom:10px");
    line("Now go back to the banner maker and press Ctrl+V.", "font-weight:600");
    box.onclick = function () {
      box.remove();
    };
    document.body.appendChild(box);
    setTimeout(function () {
      box.remove();
    }, 6000);
  };
  var fallback = function () {
    prompt("Copy this snippet (Ctrl+C):", snippet);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(snippet).then(function () {
      say(JSON.parse(snippet).title);
    }, fallback);
  } else {
    fallback();
  }
})();
`,t=`// Article scraper bookmark (marketing). Runs on an ohtuleht.ee article page, reads title, lead text,
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
`,n=e=>e.replace(/^\s*\/\/.*$/gm,``).replace(/\s+/g,` `).trim(),r=n(e),i=`javascript:`+r,a=`javascript:`+encodeURIComponent(r),o=`https://deniss-ee.github.io/ohtuleht-toolkit/`,s=n(t).replace(`__APP__`,o),c=`javascript:`+s,l=`javascript:`+encodeURIComponent(s);export{c as a,l as i,a as n,i as r,o as t};