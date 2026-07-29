/*
 * Packaging Design — 网页版桥接层
 * 原 Electron 主进程能力（选图 / 剪贴板 / 存盘）通过 window.packaging 暴露给渲染端。
 * 渲染端调用均使用可选链（window.packaging?.xxx），且在 window.packaging 缺失时会
 * 自动回退到浏览器原生 <input type=file> 与 paste 事件。因此网页版只需补齐 saveImage
 * （导出下载），其余能力由渲染端原生回退处理，逻辑无需改动。
 */
(function () {
  if (window.packaging) return; // 若已存在则不覆盖

  function triggerDownload(dataUrl, filename) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename || "packaging-design.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // 兼容导出调用形态：saveImage(dataUrl, name) 或 saveImage({ dataUrl, name })
  function resolveArgs(args) {
    let dataUrl = null;
    let name = "packaging-design";
    for (const a of args) {
      if (typeof a === "string" && a.indexOf("data:image") === 0) {
        dataUrl = a;
      } else if (a && typeof a === "object" && typeof a.dataUrl === "string") {
        dataUrl = a.dataUrl;
        if (typeof a.name === "string") name = a.name;
      } else if (typeof a === "string" && a.indexOf("data:image") !== 0) {
        name = a;
      }
    }
    if (name.indexOf(".") < 0) name += ".png";
    return { dataUrl, name };
  }

  window.packaging = {
    // openImages / pasteImages 故意不实现：
    // 渲染端在无桥时会走原生 <input type=file> 与 paste 事件，浏览器原生兼容。
    saveImage: function () {
      const { dataUrl, name } = resolveArgs(Array.prototype.slice.call(arguments));
      if (!dataUrl) {
        console.warn("[Packaging Design] saveImage: 未收到有效的图片数据");
        return;
      }
      triggerDownload(dataUrl, name);
    },
  };

  console.log("[Packaging Design] web bridge ready");
})();
