import { state } from "../../app/app-state.js";
import { fetchLessTotalSupply } from "../../data/chain/less-supply.js";

const WAD = 1_000_000_000_000_000_000n;
const REFRESH_MS = 60000;

function formatSupply(value) {
  if (!value) {
    return "—";
  }
  const whole = value / WAD;
  const decimals = value % WAD;
  const decimalStr = (decimals / 10_000_000_000_000n).toString().padStart(4, "0");
  return `${whole.toString()}.${decimalStr}`;
}

export function initLessSupplyHud() {
  const valueEl = document.getElementById("less-supply-value");
  const timeEl = document.getElementById("less-supply-time");
  if (!valueEl) {
    return;
  }

  async function refresh() {
    try {
      const supply = await fetchLessTotalSupply();
      state.lessTotalSupply = supply;
      state.lessUpdatedAt = new Date().toISOString();
    } catch (error) {
      state.lessTotalSupply = null;
      state.lessUpdatedAt = null;
    } finally {
      valueEl.textContent = formatSupply(state.lessTotalSupply);
      if (timeEl) {
        timeEl.textContent = state.lessUpdatedAt
          ? `updated ${state.lessUpdatedAt.slice(11, 19)}`
          : "updated —";
      }
      document.dispatchEvent(new CustomEvent("less-supply-change"));
    }
  }

  refresh();
  setInterval(refresh, REFRESH_MS);
}
