(function () {
  var scriptTag = document.currentScript;
  var apiBase = (scriptTag && scriptTag.dataset.api) || "http://localhost:4100";
  var title = (scriptTag && scriptTag.dataset.title) || "Rfqly";
  var wsBase = apiBase.replace(/^http/, "ws");

  var VISITOR_KEY = "rfq_widget_visitor_id";
  var visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  // Slate + cyan trade-counter palette - deliberately distinct from a
  // pink/red consumer-app look.
  var CSS = `
    #rfq-widget-bubble {
      position: fixed; bottom: 20px; right: 20px; width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #0891b2, #0f172a); color: #fff; border: none; cursor: pointer;
      box-shadow: 0 8px 24px rgba(15, 23, 42, .35); z-index: 999999; display: flex; align-items: center; justify-content: center;
    }
    #rfq-widget-panel {
      position: fixed; bottom: 88px; right: 20px; width: 360px; height: 520px; background: #fff;
      border-radius: 16px; box-shadow: 0 12px 40px rgba(15, 23, 42, .25); display: none; flex-direction: column;
      overflow: hidden; font-family: system-ui, -apple-system, sans-serif; z-index: 999999; border: 1px solid #e2e8f0;
    }
    #rfq-widget-panel.open { display: flex; }
    #rfq-widget-header {
      background: linear-gradient(135deg, #0f172a, #164e63); color: #fff; padding: 14px 16px;
      display: flex; align-items: center; gap: 10px;
    }
    #rfq-widget-header .rfq-logo {
      width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    #rfq-widget-header .rfq-title { font-weight: 600; font-size: 14px; flex: 1; }
    #rfq-widget-close { background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 4px; }
    #rfq-widget-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }

    .rfq-row { display: flex; flex-direction: column; max-width: 88%; }
    .rfq-row.buyer { align-self: flex-end; align-items: flex-end; }
    .rfq-row.bot, .rfq-row.staff { align-self: flex-start; }
    .rfq-bubble-wrap { display: flex; gap: 8px; align-items: flex-end; }
    .rfq-avatar {
      width: 24px; height: 24px; border-radius: 50%; background: #0891b2; color: #fff; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;
    }
    .rfq-bubble { padding: 9px 13px; border-radius: 12px; font-size: 13px; line-height: 1.45; white-space: pre-wrap; }
    .rfq-row.buyer .rfq-bubble { background: linear-gradient(135deg, #0891b2, #0e7490); color: #fff; border-bottom-right-radius: 4px; }
    .rfq-row.bot .rfq-bubble { background: #eef2f6; color: #0f172a; border-bottom-left-radius: 4px; }
    .rfq-row.staff .rfq-bubble { background: #e0f2fe; color: #0c4a6e; border-bottom-left-radius: 4px; }
    .rfq-copy-btn {
      margin-top: 4px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 11px;
      display: flex; align-items: center; gap: 4px; padding: 2px 4px;
    }
    .rfq-copy-btn:hover { color: #475569; }

    .rfq-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; width: 100%; margin-top: 2px; }
    .rfq-card-header { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; font-size: 13px; color: #0f172a; background: #f1f5f9; }
    .rfq-card-product { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
    .rfq-card-product .rfq-label { font-size: 10px; letter-spacing: .05em; color: #94a3b8; text-transform: uppercase; }
    .rfq-card-product .rfq-value { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .rfq-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: #f1f5f9; }
    .rfq-card-cell { background: #fff; padding: 10px 14px; }
    .rfq-card-cell .rfq-label { font-size: 10px; letter-spacing: .05em; color: #94a3b8; text-transform: uppercase; }
    .rfq-card-cell .rfq-value { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .rfq-card-total { padding: 12px 14px; background: #ecfeff; display: flex; justify-content: space-between; align-items: center; }
    .rfq-card-total .rfq-label { font-size: 11px; color: #0e7490; font-weight: 600; }
    .rfq-card-total .rfq-value { font-size: 16px; font-weight: 800; color: #0e7490; }

    #rfq-widget-form { display: flex; align-items: center; gap: 6px; border-top: 1px solid #e2e8f0; padding: 8px; background: #fff; }
    #rfq-widget-attach { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 6px; display: flex; }
    #rfq-widget-input { flex: 1; border: 1px solid #e2e8f0; border-radius: 20px; padding: 9px 14px; font-size: 13px; outline: none; }
    #rfq-widget-input:focus { border-color: #0891b2; }
    #rfq-widget-send {
      border: none; background: linear-gradient(135deg, #0891b2, #0f172a); color: #fff; width: 34px; height: 34px;
      border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    #rfq-widget-disclaimer { text-align: center; font-size: 10px; color: #94a3b8; padding: 0 12px 10px; background: #fff; }
  `;
  var style = document.createElement("style");
  style.textContent = CSS;
  document.head.appendChild(style);

  var CHAT_ICON =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var SEND_ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  var ATTACH_ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
  var COPY_ICON =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var CLOSE_ICON =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var bubble = document.createElement("button");
  bubble.id = "rfq-widget-bubble";
  bubble.innerHTML = CHAT_ICON;
  document.body.appendChild(bubble);

  var panel = document.createElement("div");
  panel.id = "rfq-widget-panel";
  panel.innerHTML =
    '<div id="rfq-widget-header">' +
    '<div class="rfq-logo">' + CHAT_ICON + "</div>" +
    '<div class="rfq-title">' + title + "</div>" +
    '<button id="rfq-widget-close">' + CLOSE_ICON + "</button>" +
    "</div>" +
    '<div id="rfq-widget-messages"></div>' +
    '<form id="rfq-widget-form">' +
    '<button id="rfq-widget-attach" type="button" title="Attach (coming soon)">' + ATTACH_ICON + "</button>" +
    '<input id="rfq-widget-input" type="text" placeholder="Type a message..." autocomplete="off" />' +
    '<button id="rfq-widget-send" type="submit">' + SEND_ICON + "</button>" +
    "</form>" +
    '<div id="rfq-widget-disclaimer">AI-generated responses may contain mistakes. Please verify important information.</div>';
  document.body.appendChild(panel);

  var messagesEl = panel.querySelector("#rfq-widget-messages");
  var formEl = panel.querySelector("#rfq-widget-form");
  var inputEl = panel.querySelector("#rfq-widget-input");
  var closeEl = panel.querySelector("#rfq-widget-close");

  function fmtMoney(n) {
    if (typeof n !== "number") return "-";
    return "PKR " + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function renderQuoteCard(meta) {
    var pb = meta.priceBreakdown || {};
    var card = document.createElement("div");
    card.className = "rfq-card";
    card.innerHTML =
      '<div class="rfq-card-header">Quote</div>' +
      '<div class="rfq-card-product">' +
      '<div class="rfq-label">Item</div>' +
      '<div class="rfq-value">' + meta.item + "</div>" +
      "</div>" +
      '<div class="rfq-card-grid">' +
      '<div class="rfq-card-cell"><div class="rfq-label">Quantity</div><div class="rfq-value">' + (meta.quantity ?? "-") + "</div></div>" +
      '<div class="rfq-card-cell"><div class="rfq-label">Unit price</div><div class="rfq-value">' + fmtMoney(pb.unitPrice) + "</div></div>" +
      '<div class="rfq-card-cell"><div class="rfq-label">Spec</div><div class="rfq-value">' + (meta.spec || meta.unit || "-") + "</div></div>" +
      '<div class="rfq-card-cell"><div class="rfq-label">In stock</div><div class="rfq-value">' + (meta.inStock ? "Yes" : "Check with team") + "</div></div>" +
      "</div>" +
      '<div class="rfq-card-total"><div class="rfq-label">Total</div><div class="rfq-value">' + fmtMoney(pb.total) + "</div></div>";
    return card;
  }

  function renderMessage(msg) {
    var row = document.createElement("div");
    row.className = "rfq-row " + msg.sender;

    var wrap = document.createElement("div");
    wrap.className = "rfq-bubble-wrap";

    if (msg.sender !== "buyer") {
      var avatar = document.createElement("div");
      avatar.className = "rfq-avatar";
      avatar.textContent = msg.sender === "staff" ? "S" : "A";
      wrap.appendChild(avatar);
    }

    var bubbleEl = document.createElement("div");
    bubbleEl.className = "rfq-bubble";
    bubbleEl.textContent = msg.text;
    wrap.appendChild(bubbleEl);
    row.appendChild(wrap);

    if (msg.sender === "buyer") {
      var copyBtn = document.createElement("button");
      copyBtn.className = "rfq-copy-btn";
      copyBtn.innerHTML = COPY_ICON + " Copy";
      copyBtn.addEventListener("click", function () {
        navigator.clipboard?.writeText(msg.text);
        copyBtn.innerHTML = COPY_ICON + " Copied";
        setTimeout(function () {
          copyBtn.innerHTML = COPY_ICON + " Copy";
        }, 1200);
      });
      row.appendChild(copyBtn);
    }

    if (msg.meta && msg.meta.type === "quote") {
      row.appendChild(renderQuoteCard(msg.meta));
    }

    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    window.dispatchEvent(new CustomEvent("rfq:message", { detail: msg }));
  }

  var socket = null;
  var conversationId = null;
  var readyPromise = null;

  function connectSocket() {
    return new Promise(function (resolve) {
      socket = new WebSocket(wsBase + "/ws/conversations/" + conversationId);
      socket.addEventListener("open", function onOpen() {
        socket.removeEventListener("open", onOpen);
        resolve();
      });
      socket.addEventListener("message", function (event) {
        var data = JSON.parse(event.data);
        if (data.type === "message") renderMessage(data.message);
      });
    });
  }

  async function init() {
    var res = await fetch(apiBase + "/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: visitorId }),
    });
    var conversation = await res.json();
    conversationId = conversation.id;

    var historyRes = await fetch(apiBase + "/conversations/" + conversationId);
    var full = await historyRes.json();
    full.messages.forEach(renderMessage);

    await connectSocket();
  }

  /** Idempotent - safe to call repeatedly; only the first call does any work. */
  function ensureReady() {
    if (!readyPromise) readyPromise = init();
    return readyPromise;
  }

  function open() {
    if (!panel.classList.contains("open")) panel.classList.add("open");
    return ensureReady();
  }

  function close() {
    panel.classList.remove("open");
  }

  function toggle() {
    if (panel.classList.contains("open")) close();
    else open();
  }

  function send(text) {
    text = (text || "").trim();
    if (!text) return Promise.resolve();
    return open().then(function () {
      socket.send(JSON.stringify({ type: "message", text: text }));
    });
  }

  bubble.addEventListener("click", toggle);
  closeEl.addEventListener("click", toggle);

  formEl.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    send(text);
  });

  // Public API so other scripts on the page (e.g. a landing-page hero box)
  // can drive the same conversation instead of re-implementing it.
  window.RFQWidget = { open: open, close: close, send: send };
})();
