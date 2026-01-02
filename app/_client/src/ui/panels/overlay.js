export function initOverlay() {
  const overlay = document.getElementById("overlay");
  const enterButton = document.getElementById("enter-btn");
  const leaderboardButton = document.getElementById("overlay-leaderboard");
  const aboutButton = document.getElementById("overlay-about");
  const aboutPanel = document.getElementById("overlay-about-panel");
  if (!overlay || !enterButton) {
    return;
  }

  function show() {
    overlay.classList.remove("is-hidden");
    document.dispatchEvent(new CustomEvent("overlay-opened"));
  }

  function dismiss() {
    requestAnimationFrame(() => {
      overlay.classList.add("is-hidden");
      document.dispatchEvent(new CustomEvent("overlay-closed"));
    });
  }

  enterButton.addEventListener("click", (event) => {
    event.preventDefault();
    dismiss();
  });
  if (leaderboardButton) {
    leaderboardButton.addEventListener("click", (event) => {
      event.preventDefault();
      dismiss();
      document.dispatchEvent(new CustomEvent("open-leaderboard"));
    });
  }
  if (aboutButton && aboutPanel) {
    aboutButton.addEventListener("click", (event) => {
      event.preventDefault();
      aboutPanel.classList.toggle("is-open");
    });
  }

  document.addEventListener("open-overlay", show);
}
