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

let p5LoadPromise;

function loadP5Library() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve();
  }
  if (typeof window.p5 === "function") {
    return Promise.resolve();
  }
  if (p5LoadPromise) {
    return p5LoadPromise;
  }
  p5LoadPromise = new Promise((resolve, reject) => {
    const poll = () => {
      if (typeof window.p5 === "function") {
        resolve();
        return;
      }
      setTimeout(poll, 50);
    };
    poll();
  });
  return p5LoadPromise;
}

function ensureP5Instance() {
  if (typeof window === "undefined") {
    return;
  }
  if (window.__CUBELESS_P5__) {
    return;
  }
  loadP5Library()
    .then(() => {
      if (window.__CUBELESS_P5__ || typeof window.p5 !== "function") {
        return;
      }
      window.__CUBELESS_P5__ = new window.p5();
    })
    .catch((error) => {
      console.warn("p5.js failed to load:", error);
    });
}

ensureP5Instance();
