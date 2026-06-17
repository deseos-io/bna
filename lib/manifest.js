(function () {
  "use strict";
  var DEFAULTS = {
    name: "BioNeuroAdelgaza®", mentor: "Micaela Gallardo",
    price: "$33", pricePeriod: "USD/mes",
    checkoutUrl: "", videoUrl: "",
    legal: { privacidad: "privacidad.html", terminos: "terminos.html" }
  };
  function dispatch() { document.dispatchEvent(new CustomEvent("brandLoaded")); }
  fetch("/_data/site.json")
    .then(function (r) { return r.json(); })
    .then(function (cfg) { window.__BRAND__ = Object.assign({}, DEFAULTS, cfg); dispatch(); })
    .catch(function () { window.__BRAND__ = DEFAULTS; dispatch(); });
})();
