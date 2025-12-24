import { initOverlay } from "./overlay.js";
import { initLocalTextureUi } from "./local-textures.js";
import { initExportUi } from "./export-ui.js";
import { initLeaderboardUi } from "./leaderboard.js";
import { initEthHud } from "./eth-hud.js";
import { initPreviewUi } from "./preview.js";
import { initLessSupplyHud } from "./less-hud.js";
import { initWalletUi } from "../features/wallet/wallet-ui.js";
import { initNftPickerUi } from "../features/nft/picker-ui.js";
import { initMintUi } from "../features/mint/mint-ui.js";

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
  initPreviewUi();
  initUiTouchGuards();
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
