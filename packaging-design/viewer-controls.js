/*
 * Packaging Design — 预览视窗缩放按钮组
 *
 * 根因：之前版本在 <head> 中以同步 <script> 加载，此时 document.body 仍为 null，
 * 执行 obs.observe(document.body,...) 直接抛错，导致整个 IIFE 崩溃，按钮从未被创建。
 *
 * 修复：
 *  - 不再依赖 document.body，改为观察 document.documentElement（head 阶段即存在）。
 *  - 监听 .mockup-canvas 出现后再注入按钮；并加 3s 兜底强制注入。
 *  - 按钮点击优先调用 window.__viewer.fitView()/zoomIn()/zoomOut()（由主 JS 闭包内
 *    实现，直接操控真实 camera / OrbitControls）；若 __viewer 缺失则回退为派发
 *    zoom-mockup-* 事件（主 JS 已内置对应监听器）。两种路径最终都落到同一套已实现逻辑。
 */
(function () {
  function mountTarget() {
    // 优先挂到预览容器 .mockup-canvas 内，使 absolute 定位相对预览区左上角；
    // 找不到时回退到 body（此时 absolute 仍相对于视口，不会变成全屏 fixed）。
    return document.querySelector(".mockup-canvas") || document.body || document.documentElement;
  }

  function createControls() {
    var existing = document.getElementById("pd-viewer-controls");
    if (existing) {
      // 若节点被 React 重渲染移除后重建，确保重新挂到预览容器内
      var host = mountTarget();
      if (existing.parentElement !== host) host.appendChild(existing);
      return;
    }

    var el = document.createElement("div");
    el.id = "pd-viewer-controls";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", "预览缩放控制");
    el.innerHTML =
      '<button type="button" data-action="fit" title="完整显示 / 100%" aria-label="完整显示">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>' +
      '</button>' +
      '<button type="button" data-action="out" title="缩小" aria-label="缩小">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' +
      '</button>' +
      '<button type="button" data-action="in" title="放大" aria-label="放大">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' +
      '</button>' +
      '<button type="button" data-action="bottom" title="看底面" aria-label="看底面"><svg viewBox="0 0 1024 1024" fill="currentColor" width="16" height="16"><path d="M447.68 1013.12c-29.76-9.408-62.4-24.512-103.296-43.392L252.736 927.36c-60.16-27.84-108.992-50.432-142.4-72.192-33.472-21.76-63.104-50.24-63.104-93.12s29.632-71.296 63.104-93.056c33.408-21.888 82.24-44.416 142.4-72.192l91.52-42.368c71.424-33.024 117.568-54.272 167.36-54.272 49.856 0 96 21.248 167.36 54.272l91.584 42.368c60.16 27.776 108.928 50.304 142.4 72.192 33.472 21.76 63.104 50.24 63.104 93.056 0 42.88-29.632 71.296-63.104 93.12-33.472 21.76-82.304 44.352-142.4 72.192l-91.52 42.368c-71.424 32.96-117.568 54.272-167.36 54.272-17.408 0-34.368-2.56-52.096-7.36a291.328 291.328 0 0 1-11.904-3.52z m-80.896-111.808c81.728 37.76 112.768 51.2 144.896 51.2v0.128c18.496 0 36.544-4.48 64-15.36 20.48-8.128 46.08-19.84 80.96-35.968l81.216-37.504c63.552-29.44 107.52-49.92 136.128-68.48 29.056-18.944 30.72-28.672 30.72-33.28 0-4.544-1.664-14.272-30.72-33.28-28.544-18.56-72.576-39.04-136.128-68.48l-81.28-37.44c-81.6-37.76-112.704-51.328-144.832-51.328-32.192 0-63.232 13.44-144.96 51.328l-81.216 37.504c-63.552 29.44-107.52 49.856-136.128 68.48-29.056 18.944-30.72 28.672-30.72 33.28 0 4.48 1.664 14.272 30.72 33.28 28.544 18.56 72.576 39.04 136.128 68.48l81.28 37.44z"/><path d="M72.384 584.128a35.712 35.712 0 1 0 49.92-49.792 15.232 15.232 0 0 1-3.584-9.6c0-1.28 0.192-3.328 1.536-6.144 2.688-5.376 9.856-13.696 28.992-25.984 8.192-5.248 17.664-10.688 28.544-16.448 26.88-14.272 62.272-30.464 107.648-51.136l81.152-36.928c81.664-37.184 112.896-50.56 145.152-50.56 32.256 0 63.36 13.376 145.024 50.56l81.28 36.928c63.552 29.056 107.648 49.152 136.128 67.52 29.248 18.816 30.528 28.288 30.528 32.256-0.064 3.456-1.28 6.784-3.52 9.472a35.712 35.712 0 0 0 58.24 41.472c10.56-14.976 16.704-32 16.704-50.944 0-42.816-30.016-70.912-63.36-92.352-33.408-21.376-82.176-43.712-142.336-71.04L678.976 319.68c-71.424-32.64-117.504-53.632-167.232-53.632-49.728 0-95.744 21.056-167.232 53.632l-91.584 41.728c-60.096 27.328-108.864 49.536-142.336 71.04C77.376 453.888 47.296 481.984 47.296 524.8c0 19.008 6.144 35.968 16.704 50.944a35.648 35.648 0 0 0 8.32 8.32z"/><path d="M47.296 258.688c0 33.92 18.944 58.688 42.944 77.888a527.808 527.808 0 0 0 1.088 0.832l0.128 0.128a35.712 35.712 0 0 0 43.52-56.64l-0.256-0.192c-15.296-12.288-16-18.688-16-22.016 0-3.904 1.28-13.44 30.528-32.192 28.544-18.368 72.576-38.528 136.192-67.52l81.28-36.992c81.536-37.12 112.64-50.56 145.024-50.56 32.192 0 63.36 13.44 145.088 50.56l81.152 36.992c63.68 28.928 107.584 49.152 136.192 67.52 29.248 18.688 30.528 28.16 30.528 32.192 0 3.328-0.832 9.792-16.256 22.208a35.712 35.712 0 0 0 44.544 55.872c24.064-19.2 43.136-44.16 43.136-78.08 0-42.752-30.016-70.912-63.36-92.352-33.408-21.44-82.176-43.648-142.336-71.04L678.912 53.504C607.424 20.928 561.472 0 511.744 0 462.016 0 415.808 20.928 344.448 53.568l-91.52 41.664c-60.096 27.456-108.864 49.664-142.336 71.04C77.376 187.84 47.296 215.936 47.296 258.752z m48.704 72.96l-0.256-0.256-0.192-0.128 0.192 0.128 0.256 0.256z m-0.832-0.64l0.128 0.064-0.064-0.064z m-0.256-0.256z m35.648-43.904l0.256 0.192 0.064 0.064 0.384 0.32-0.384-0.32h-0.064L130.496 286.784z m-0.448-0.32l-0.384-0.32 0.384 0.32zM146.688 697.216l512 256L687.296 896l-512-256-28.608 57.216zM338.688 633.216l512 256L879.296 832 367.296 576l-28.608 57.216z"/></svg></button>' +
      '<button type="button" data-action="pan" title="抓手平移" aria-label="抓手平移"><svg viewBox="0 0 200 200" fill="currentColor" width="16" height="16"><path d="M191.5,98.8l-7.8-7.8-22.1-22.1c-.7-.7-1.9-.7-2.6,0l-7.8,7.8c-.7.7-.7,1.9,0,2.6l13.4,13.4h-44.3c-1,0-1.8.8-1.8,1.8v11c0,1,.8,1.8,1.8,1.8h44.4l-13.5,13.5c-.7.7-.7,1.9,0,2.6l7.8,7.8c.7.7,1.9.7,2.6,0l22.1-22.1,7.8-7.8c.7-.7.7-1.9,0-2.6Z"/><path d="M35.5,107.4h44.3c1,0,1.8-.8,1.8-1.8v-11c0-1-.8-1.8-1.8-1.8h-44.3l13.5-13.5c.7-.7.7-1.9,0-2.6l-7.8-7.8c-.7-.7-1.9-.7-2.6,0l-22.1,22.1-7.8,7.8c-.7.7-.7,1.9,0,2.6l7.8,7.8,22.1,22.1c.7.7,1.9.7,2.6,0l7.8-7.8c.7-.7.7-1.9,0-2.6l-13.5-13.4Z"/><path d="M76.6,48.9c.7.7,1.9.7,2.6,0l13.4-13.5v44.3c0,1,.8,1.8,1.8,1.8h11c1,0,1.8-.8,1.8-1.8v-44.3l13.5,13.5c.7.7,1.9.7,2.6,0l7.8-7.8c.7-.7.7-1.9,0-2.6l-22.1-22.1-7.8-7.8c-.7-.7-1.9-.7-2.6,0l-7.8,7.8-22.1,22.1c-.7.7-.7,1.9,0,2.6l7.8,7.8Z"/><path d="M123.4,151.1c-.7-.7-1.9-.7-2.6,0l-13.4,13.5v-44.3c0-1-.8-1.8-1.8-1.8h-11c-1,0-1.8.8-1.8,1.8v44.3l-13.5-13.5c-.7-.7-1.9-.7-2.6,0l-7.8,7.8c-.7.7-.7,1.9,0,2.6l22.1,22.1,7.8,7.8c.7.7,1.9.7,2.6,0l7.8-7.8,22.1-22.1c.7-.7.7-1.9,0-2.6l-7.8-7.8Z"/></svg></button>';

    el.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("button") : null;
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      var api = window.__viewer;
      if (api) {
        if (action === "fit" && typeof api.fitView === "function") return api.fitView();
        if (action === "in" && typeof api.zoomIn === "function") return api.zoomIn();
        if (action === "out" && typeof api.zoomOut === "function") return api.zoomOut();
        if (action === "bottom" && typeof api.viewBottom === "function") return api.viewBottom();
        if (action === "pan" && typeof api.togglePanMode === "function") {
          api.togglePanMode();
          var active = typeof api.isPanMode === "function" ? api.isPanMode() : false;
          btn.classList.toggle("active", active);
          btn.title = active ? "退出抓手平移" : "抓手平移";
          btn.setAttribute("aria-label", active ? "退出抓手平移" : "抓手平移");
          return;
        }
      }
      window.dispatchEvent(new CustomEvent("zoom-mockup-" + action, { detail: {} }));
    });

    mountTarget().appendChild(el);

    // 若 React 重渲染把按钮节点移除，监听预览容器变化并重新挂载
    var host = mountTarget();
    if (host && typeof MutationObserver !== "undefined" && !el.__guardAttached) {
      el.__guardAttached = true;
      var guard = new MutationObserver(function () {
        if (!document.getElementById("pd-viewer-controls")) createControls();
      });
      guard.observe(host, { childList: true });
    }
  }

  function start() {
    if (document.querySelector(".mockup-canvas")) {
      createControls();
      return;
    }
    if (document.documentElement && typeof MutationObserver !== "undefined") {
      var obs = new MutationObserver(function () {
        if (document.querySelector(".mockup-canvas")) {
          createControls();
          obs.disconnect();
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    }
    // 兜底：即便画布挂载延迟，也强制注入按钮
    setTimeout(createControls, 3000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
