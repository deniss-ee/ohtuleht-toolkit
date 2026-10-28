// Fixed ClickTag helper required by the ad server. Never edited by hand or in the generator.
// The ad server passes clickMacro / clickTag in the query string.
export const CLICKTAG_JS =
  'var olBanner={getQueryStringValue:function(k){return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&?]"+encodeURIComponent(k).replace(/[.+*]/g,"$&")+"(?:=([^&]*))?)?.*$","i"),"$1"))},' +
  "getClickTag:function(u){this.clickMacro=this.getQueryStringValue('clickMacro');this.clickTag=this.getQueryStringValue('clickTag');" +
  "return u!==undefined&&u.length>0?this.clickMacro+u:this.clickTag}};var clickTag=\"\";";

// Attribute value that opens a URL through the ClickTag helper.
export function clickAttr(escapedUrl: string): string {
  return `window.open(olBanner.getClickTag('${escapedUrl}'),'_blank')`;
}
