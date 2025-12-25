import { initOverlay } from "./panels/overlay.js";
import { initLocalTextureUi } from "./panels/local-textures.js";
import { initExportUi } from "./panels/export-ui.js";
import { initLeaderboardUi } from "./panels/leaderboard.js";
import { initPreviewUi } from "./panels/preview.js";
import { initEthHud } from "./hud/eth-hud.js";
import { initLessSupplyHud } from "./hud/less-hud.js";
import { initLessDeltaTracking } from "./hud/less-delta.js";
import { initWalletUi } from "../features/wallet/wallet-ui.js";
import { initNftPickerUi } from "../features/nft/picker-ui.js";
import { initMintUi } from "../features/mint/mint-ui.js";
import { state } from "../app/app-state.js";

export function initUiRoot() {
  initOverlay();
  initLocalTextureUi();
  initExportUi();
  initWalletUi();
  initNftPickerUi();
  initMintUi();
  initLeaderboardUi();
  initEthHud();
  initLessSupplyHud();
  initLessDeltaTracking();
  initPreviewUi();
  initUiTouchGuards();
  initTokenIdFromUrl();
}

function initUiTouchGuards() {
  const selectors = ["#ui", "#leaderboard", "#preview-bar", "#overlay"];
  selectors.forEach((selector) => {
    const el = document.querySelector(selector);
    if (!el) {
      return;
    }
    ["touchstart", "touchmove", "touchend"].forEach((eventName) => {
      el.addEventListener(
        eventName,
        (event) => {
          event.stopPropagation();
        },
        { passive: true }
      );
    });
  });
}

function initTokenIdFromUrl() {
  if (typeof window === "undefined") {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  const tokenId = params.get("tokenId");
  if (!tokenId) {
    return;
  }
  try {
    state.currentCubeTokenId = BigInt(tokenId);
    document.dispatchEvent(new CustomEvent("cube-token-change"));
  } catch (error) {
    state.currentCubeTokenId = null;
  }
}
