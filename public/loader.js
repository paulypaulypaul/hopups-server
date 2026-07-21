(function () {
  "use strict";

  function getConfigEndpoint(siteId, origin) {
    return origin + "/api/widget/" + siteId + "/config";
  }

  function getCurrentSiteId(scriptEl) {
    return scriptEl ? scriptEl.getAttribute("data-site-id") : null;
  }

  function getOrigin(scriptEl, win) {
    if (scriptEl && scriptEl.src) {
      return new URL(scriptEl.src).origin;
    }
    return win.location.origin;
  }

  function init(doc, win, fetchImpl) {
    var scriptEl = doc.currentScript;
    var siteId = getCurrentSiteId(scriptEl);
    if (!siteId) {
      return Promise.resolve(null);
    }

    var origin = getOrigin(scriptEl, win);

    return fetchImpl(getConfigEndpoint(siteId, origin))
      .then(function (response) {
        return response.json();
      })
      .then(function (config) {
        win.__hopupsConfig = config;
        return config;
      });
  }

  var api = { getConfigEndpoint: getConfigEndpoint, getCurrentSiteId: getCurrentSiteId, getOrigin: getOrigin, init: init };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof document !== "undefined") {
    init(document, window, window.fetch.bind(window));
  }
})();
