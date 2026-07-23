(function () {
  "use strict";

  var VISITOR_STORAGE_KEY = "hopups_visitor_id";
  var STYLE_ELEMENT_ID = "hopups-widget-styles";

  function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getOrCreateVisitorId(storage) {
    var existing = storage.getItem(VISITOR_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    var created = generateId();
    storage.setItem(VISITOR_STORAGE_KEY, created);
    return created;
  }

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

  function buildSyncPayload(siteId, visitorId, path) {
    return {
      visitorId: visitorId,
      siteId: siteId,
      events: [{ type: "pageview", path: path, timestamp: new Date().toISOString() }]
    };
  }

  function ensureStyles(doc) {
    if (doc.getElementById(STYLE_ELEMENT_ID)) {
      return;
    }
    var style = doc.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent =
      ".hopups-banner{position:fixed;top:0;left:0;right:0;background:#ff4081;color:#fff;" +
      "padding:.75rem 1rem;text-align:center;z-index:9999;font-family:sans-serif;}" +
      ".hopups-banner a{color:#fff;margin-left:.5rem;text-decoration:underline;}" +
      ".hopups-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;" +
      "align-items:center;justify-content:center;z-index:9999;}" +
      ".hopups-modal{background:#fff;padding:1.5rem;border-radius:4px;max-width:320px;" +
      "position:relative;font-family:sans-serif;}" +
      ".hopups-modal button{position:absolute;top:.5rem;right:.5rem;border:none;background:none;" +
      "font-size:1.2rem;cursor:pointer;}" +
      ".hopups-sidebar{position:fixed;top:0;bottom:0;width:280px;background:#fff;" +
      "box-shadow:0 0 12px rgba(0,0,0,.25);padding:1.5rem;z-index:9999;font-family:sans-serif;}" +
      ".hopups-sidebar.hopups-sidebar-left{left:0;}" +
      ".hopups-sidebar.hopups-sidebar-right{right:0;}" +
      ".hopups-sidebar button{position:absolute;top:.5rem;right:.5rem;border:none;background:none;" +
      "font-size:1.2rem;cursor:pointer;}";
    doc.head.appendChild(style);
  }

  function renderPhoneNumberSwap(doc, payload, phoneNumber) {
    if (!phoneNumber) {
      return;
    }
    var nodes = doc.querySelectorAll(payload.selector);
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = phoneNumber;
    }
  }

  function renderBanner(doc, payload) {
    ensureStyles(doc);
    var bar = doc.createElement("div");
    bar.className = "hopups-banner";
    bar.textContent = payload.message;
    if (payload.ctaLabel && payload.ctaUrl) {
      var link = doc.createElement("a");
      link.href = payload.ctaUrl;
      link.textContent = payload.ctaLabel;
      bar.appendChild(link);
    }
    doc.body.appendChild(bar);
  }

  function renderModal(doc, payload) {
    ensureStyles(doc);
    var overlay = doc.createElement("div");
    overlay.className = "hopups-modal-overlay";

    var modal = doc.createElement("div");
    modal.className = "hopups-modal";

    var title = doc.createElement("h2");
    title.textContent = payload.title;
    modal.appendChild(title);

    var body = doc.createElement("p");
    body.textContent = payload.body;
    modal.appendChild(body);

    if (payload.ctaLabel && payload.ctaUrl) {
      var link = doc.createElement("a");
      link.href = payload.ctaUrl;
      link.textContent = payload.ctaLabel;
      modal.appendChild(link);
    }

    var close = doc.createElement("button");
    close.textContent = "×";
    close.setAttribute("aria-label", "Close");
    close.onclick = function () {
      overlay.parentNode.removeChild(overlay);
    };
    modal.appendChild(close);

    overlay.appendChild(modal);
    doc.body.appendChild(overlay);
  }

  function renderCustomHtml(doc, payload) {
    var container = doc.createElement("div");
    container.className = "hopups-custom-html";
    container.innerHTML = payload.html;
    doc.body.appendChild(container);
  }

  function renderSidebar(doc, payload) {
    ensureStyles(doc);
    var panel = doc.createElement("div");
    panel.className = "hopups-sidebar hopups-sidebar-" + (payload.position === "left" ? "left" : "right");

    if (payload.title) {
      var title = doc.createElement("h3");
      title.textContent = payload.title;
      panel.appendChild(title);
    }

    var message = doc.createElement("p");
    message.textContent = payload.message;
    panel.appendChild(message);

    if (payload.ctaLabel && payload.ctaUrl) {
      var link = doc.createElement("a");
      link.href = payload.ctaUrl;
      link.textContent = payload.ctaLabel;
      panel.appendChild(link);
    }

    var close = doc.createElement("button");
    close.textContent = "×";
    close.setAttribute("aria-label", "Close");
    close.onclick = function () {
      panel.parentNode.removeChild(panel);
    };
    panel.appendChild(close);

    doc.body.appendChild(panel);
  }

  function performRedirect(win, payload) {
    var delay = payload.delayMs || 0;
    win.setTimeout(function () {
      win.location.href = payload.url;
    }, delay);
  }

  function applyAction(doc, win, action, phoneNumber) {
    switch (action.type) {
      case "phoneNumberSwap":
        return renderPhoneNumberSwap(doc, action.payload, phoneNumber);
      case "banner":
        return renderBanner(doc, action.payload);
      case "modal":
        return renderModal(doc, action.payload);
      case "customHtml":
        return renderCustomHtml(doc, action.payload);
      case "redirect":
        return performRedirect(win, action.payload);
      case "sidebar":
        return renderSidebar(doc, action.payload);
      default:
        return undefined;
    }
  }

  function applyActions(doc, win, syncResponse) {
    var actions = syncResponse.actions || [];
    for (var i = 0; i < actions.length; i++) {
      applyAction(doc, win, actions[i], syncResponse.phoneNumber);
    }
  }

  function postSync(fetchImpl, syncUrl, siteId, visitorId, path) {
    return fetchImpl(syncUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildSyncPayload(siteId, visitorId, path))
    }).then(function (response) {
      return response.json();
    });
  }

  function init(doc, win, fetchImpl) {
    var scriptEl = doc.currentScript;
    var siteId = getCurrentSiteId(scriptEl);
    if (!siteId) {
      return Promise.resolve(null);
    }

    var origin = getOrigin(scriptEl, win);
    var visitorId = getOrCreateVisitorId(win.localStorage);

    return fetchImpl(getConfigEndpoint(siteId, origin))
      .then(function (response) {
        return response.json();
      })
      .then(function (config) {
        win.__hopupsConfig = config;
        return postSync(fetchImpl, config.syncUrl, siteId, visitorId, win.location.pathname);
      })
      .then(function (syncResponse) {
        win.__hopupsSyncResponse = syncResponse;
        applyActions(doc, win, syncResponse);
        return syncResponse;
      });
  }

  var api = {
    getConfigEndpoint: getConfigEndpoint,
    getCurrentSiteId: getCurrentSiteId,
    getOrigin: getOrigin,
    getOrCreateVisitorId: getOrCreateVisitorId,
    buildSyncPayload: buildSyncPayload,
    applyActions: applyActions,
    renderPhoneNumberSwap: renderPhoneNumberSwap,
    renderBanner: renderBanner,
    renderModal: renderModal,
    renderCustomHtml: renderCustomHtml,
    renderSidebar: renderSidebar,
    performRedirect: performRedirect,
    init: init
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (typeof document !== "undefined") {
    init(document, window, window.fetch.bind(window));
  }
})();
