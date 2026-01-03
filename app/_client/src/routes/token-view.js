import { state } from "../app/app-state.js";
import {
  mapSelectionToFaceTextures,
  downscaleImageToMax,
  getMaxTextureSize,
} from "../app/app-utils.js";
import { fetchTokenUri } from "../data/chain/cubixles-reader.js";
import { getProvenance } from "../data/nft/indexer";
import { resolveUri } from "../shared/utils/uri";
import { CUBIXLES_CONTRACT } from "../config/contracts";
import { fetchWithGateways } from "../../../../src/shared/ipfs-fetch.js";
import { metadataSchema, extractRefs } from "../../../../src/shared/schemas/metadata.js";

function parseTokenIdFromPath() {
  const path = window.location.pathname || "";
  const match = path.match(/^\/m\/(\d+)\/?$/);
  if (!match) {
    return null;
  }
  return match[1];
}

function setStatus(message, tone = "neutral") {
  const statusEl = document.getElementById("token-view-status");
  if (!statusEl) {
    return;
  }
  statusEl.classList.remove("is-hidden");
  statusEl.textContent = message;
  statusEl.classList.toggle("is-error", tone === "error");
}

async function loadImages(urlSets) {
  if (typeof loadImage !== "function") {
    throw new Error("Image loader unavailable.");
  }
  const maxSize = getMaxTextureSize();
  const loaders = urlSets.map(
    (urls) =>
      new Promise((resolve) => {
        const candidates = Array.isArray(urls) ? urls.filter(Boolean) : [];
        if (!candidates.length) {
          resolve(null);
          return;
        }
        const tryLoad = (index) => {
          if (index >= candidates.length) {
            resolve(null);
            return;
          }
          const url = candidates[index];
          loadImage(
            url,
            (img) => resolve(downscaleImageToMax(img, maxSize)),
            () => tryLoad(index + 1)
          );
        };
        tryLoad(0);
      })
  );
  return Promise.all(loaders);
}

async function resolveMetadataImageCandidates(nft) {
  const candidates = [];
  if (nft?.image?.resolved) {
    candidates.push(nft.image.resolved);
  }
  const tokenUri = nft?.tokenUri?.resolved;
  if (!tokenUri) {
    return candidates;
  }
  try {
    let response;
    if (tokenUri.startsWith("ipfs://")) {
      ({ response } = await fetchWithGateways(tokenUri));
    } else {
      response = await fetch(tokenUri);
    }
    if (!response?.ok) {
      return candidates;
    }
    const metadata = await response.json();
    const imageCandidates = [
      metadata?.image,
      metadata?.image_url,
      metadata?.imageUrl,
    ];
    imageCandidates.forEach((candidate) => {
      if (typeof candidate !== "string" || !candidate.trim()) {
        return;
      }
      const resolved = resolveUri(candidate)?.resolved ?? null;
      if (resolved) {
        candidates.push(resolved);
      }
    });
    if (typeof metadata?.image_data === "string") {
      const svg = metadata.image_data.trim();
      if (!svg) {
        return candidates;
      }
      candidates.push(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
    }
  } catch (error) {
    return candidates;
  }
  return Array.from(new Set(candidates));
}

async function waitForFrostedTexture() {
  if (typeof window !== "undefined" && window.__CUBIXLES_SKIP_FROSTED__) {
    return;
  }
  if (state.frostedTexture) {
    return;
  }
  await new Promise((resolve) => {
    const check = () => {
      if (state.frostedTexture) {
        resolve();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
}

function initTokenShareDialog() {
  const modal = document.createElement("div");
  modal.id = "share-modal";
  modal.className = "share-modal is-hidden";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.innerHTML = `
    <div id="share-backdrop" class="share-backdrop" aria-hidden="true"></div>
      <div class="share-card">
        <div class="share-title">Share this cube</div>
        <div class="share-actions">
        <a id="share-x" class="share-button" target="_blank" rel="noreferrer">X</a>
        <button id="share-copy" class="share-button is-ghost" type="button">Copy link</button>
        </div>
        <button id="share-close" class="share-close" type="button">Close</button>
      </div>
  `;
  document.body.appendChild(modal);
  modal.style.display = "none";

  const backdrop = modal.querySelector("#share-backdrop");
  const closeButton = modal.querySelector("#share-close");
  const copyButton = modal.querySelector("#share-copy");
  const xLink = modal.querySelector("#share-x");

  let currentUrl = "";

  function openShareLink(event) {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!xLink?.href) {
      return;
    }
    const opened = window.open(xLink.href, "_blank", "noopener,noreferrer");
    if (!opened) {
      window.location.href = xLink.href;
    }
  }

  function closeModal(event) {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    if (event?.preventDefault) {
      event.preventDefault();
    }
    modal.classList.add("is-hidden");
    modal.style.display = "none";
  }

  async function copyLink(event) {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!currentUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(currentUrl);
      copyButton.textContent = "Copied!";
    } catch (error) {
      copyButton.textContent = "Copy failed";
    }
    window.setTimeout(() => {
      copyButton.textContent = "Copy link";
    }, 1200);
  }

  function openModal(url) {
    currentUrl = url;
    const encoded = encodeURIComponent(url);
    const text = encodeURIComponent("cubixles_ and curtains");
    xLink.href = `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`;
    modal.classList.remove("is-hidden");
    modal.style.display = "flex";
  }

  backdrop?.addEventListener("click", closeModal);
  closeButton?.addEventListener("click", closeModal);
  copyButton?.addEventListener("click", copyLink);
  backdrop?.addEventListener("pointerdown", closeModal);
  closeButton?.addEventListener("pointerdown", closeModal);
  copyButton?.addEventListener("pointerdown", copyLink);
  xLink?.addEventListener("pointerdown", openShareLink);
  backdrop?.addEventListener("touchstart", closeModal, { passive: false });
  closeButton?.addEventListener("touchstart", closeModal, { passive: false });
  copyButton?.addEventListener("touchstart", copyLink, { passive: false });
  xLink?.addEventListener("touchstart", openShareLink, { passive: false });
  xLink?.addEventListener("click", openShareLink);

  const shareButton = document.createElement("button");
  shareButton.id = "share-cube";
  shareButton.className = "share-cube-button";
  shareButton.type = "button";
  shareButton.textContent = "share cube";
  document.body.appendChild(shareButton);

  function handleShareActivate(event) {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!currentUrl) {
      return;
    }
    openModal(currentUrl);
  }

  shareButton.addEventListener("click", handleShareActivate);
  shareButton.addEventListener("pointerdown", handleShareActivate);
  shareButton.addEventListener("touchstart", handleShareActivate, { passive: false });

  return (url) => {
    currentUrl = url;
  };
}


export async function initTokenViewRoute() {
  if (typeof window === "undefined") {
    return false;
  }
  const tokenIdRaw = parseTokenIdFromPath();
  if (!tokenIdRaw) {
    return false;
  }
  document.body.classList.add("is-token-view");
  setStatus("Loading token metadata...");
  const setShareUrl = initTokenShareDialog();

  let tokenId;
  try {
    tokenId = BigInt(tokenIdRaw);
  } catch (error) {
    setStatus("Invalid tokenId in URL.", "error");
    return true;
  }

  state.currentCubeTokenId = tokenId;
  document.dispatchEvent(new CustomEvent("cube-token-change"));

  if (typeof setShareUrl === "function") {
    setShareUrl(`${window.location.origin}/m/${tokenId.toString()}`);
  }

  try {
    const tokenUri = await fetchTokenUri(tokenId);
    const resolved = resolveUri(tokenUri);
    if (!resolved?.resolved) {
      throw new Error("Token URI could not be resolved.");
    }
    const { response } = await fetchWithGateways(resolved.resolved);
    if (!response.ok) {
      throw new Error(`Metadata fetch failed (${response.status}).`);
    }
    const metadataJson = await response.json();
    const validation = metadataSchema.safeParse(metadataJson);
    if (!validation.success) {
      throw new Error("Metadata failed schema validation.");
    }
    const refs = extractRefs(validation.data);
    if (!refs.length) {
      throw new Error("No provenance refs found in metadata.");
    }

    setStatus("Loading referenced NFTs...");
    const nfts = await Promise.all(
      refs.map((ref) =>
        getProvenance(
          ref.contractAddress,
          String(ref.tokenId),
          CUBIXLES_CONTRACT.chainId
        )
      )
    );
    const urlSets = await Promise.all(
      nfts.map((nft) => resolveMetadataImageCandidates(nft))
    );
    if (urlSets.some((urls) => !urls || urls.length === 0)) {
      throw new Error("One or more referenced NFTs are missing images.");
    }
    const images = await loadImages(urlSets);

    await waitForFrostedTexture();
    const fallbackTexture = state.frostedTexture || null;
    const filled = images.map((img) => img || fallbackTexture);
    if (filled.some((img) => !img)) {
      throw new Error("Failed to load NFT images.");
    }
    if (images.some((img) => !img)) {
      console.warn("Some NFT images failed to load; using fallback texture.");
    }

    state.faceTextures = mapSelectionToFaceTextures(filled, state.frostedTexture);
    state.nftSelection = nfts;
    setStatus("Loaded.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load token.";
    setStatus(message, "error");
  }

  return true;
}
