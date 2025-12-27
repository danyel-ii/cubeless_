import { Buffer } from "buffer";
import { registerAppLifecycle } from "./app/app-lifecycle.js";
import { initTokenViewRoute } from "./routes/token-view.js";
import { initUiRoot } from "./ui/ui-root.js";

if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}

registerAppLifecycle();
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUiRoot, { once: true });
  } else {
    initUiRoot();
  }
}
initTokenViewRoute();

function ensureP5Instance() {
  if (typeof window === "undefined") {
    return;
  }
  if (window.__CUBELESS_P5__) {
    return;
  }
  if (typeof window.p5 !== "function") {
    setTimeout(ensureP5Instance, 50);
    return;
  }
  window.__CUBELESS_P5__ = new window.p5();
}

ensureP5Instance();
