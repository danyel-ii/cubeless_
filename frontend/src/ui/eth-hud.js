import { state } from "../app/app-state.js";

function formatEth(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "0.0000";
  }
  return value.toFixed(4);
}

export function initEthHud() {
  const hud = document.getElementById("eth-hud");
  const valueEl = document.getElementById("eth-hud-value");
  const timeEl = document.getElementById("eth-hud-time");
  if (!hud || !valueEl) {
    return;
  }

  function render() {
    valueEl.textContent = `${formatEth(state.sumFloorEth)} ETH`;
    if (timeEl) {
      timeEl.textContent = state.floorSnapshotAt
        ? `snapshot: ${state.floorSnapshotAt.slice(11, 19)}`
        : "snapshot: —";
    }
  }

  render();
  document.addEventListener("floor-snapshot-change", render);
}
