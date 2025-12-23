import { BrowserProvider, Contract, parseEther } from "ethers";
import { ICECUBE_CONTRACT } from "../config/contracts";
import { buildProvenanceBundle } from "../nft/indexer";
import { subscribeWallet } from "../wallet/wallet";
import { state } from "../app/app-state.js";
import {
  buildMintMetadata,
  getMintAnimationUrl,
} from "./mint-metadata.js";
import { buildTokenUri } from "./token-uri-provider.js";

const SEPOLIA_CHAIN_ID = 11155111;
const MINT_PRICE = 0.0027;
const MINT_ROYALTY_BPS = 1000;
const IS_DEV = Boolean(import.meta?.env?.DEV);

function formatError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Mint failed.";
}

function isZeroAddress(address) {
  return !address || address === "0x0000000000000000000000000000000000000000";
}

export function initMintUi() {
  const statusEl = document.getElementById("mint-status");
  const mintButton = document.getElementById("mint-submit");
  const amountInput = document.getElementById("mint-payment");

  if (!statusEl || !mintButton || !amountInput) {
    return;
  }

  let walletState = null;
  const devChecklist = IS_DEV ? initDevChecklist(statusEl.parentElement) : null;

  function setStatus(message, tone = "neutral") {
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", tone === "error");
    statusEl.classList.toggle("is-success", tone === "success");
  }

  function setDisabled(disabled) {
    mintButton.disabled = disabled;
    amountInput.disabled = disabled;
  }

  function updateEligibility() {
    if (!walletState || walletState.status !== "connected") {
      setStatus("Connect your wallet to mint.");
      setDisabled(true);
      return;
    }
    if (isZeroAddress(ICECUBE_CONTRACT.address)) {
      setStatus("Deploy contract and update address before minting.", "error");
      setDisabled(true);
      return;
    }
    if (state.nftSelection.length < 1 || state.nftSelection.length > 6) {
      setStatus("Select 1 to 6 NFTs to mint.");
      setDisabled(true);
      return;
    }
    if (!ICECUBE_CONTRACT.abi || ICECUBE_CONTRACT.abi.length === 0) {
      setStatus("ABI missing. Run export-abi before minting.", "error");
      setDisabled(true);
      return;
    }
    if (!getMintAnimationUrl()) {
      setStatus("Set VITE_APP_ANIMATION_URL before minting.", "error");
      setDisabled(true);
      return;
    }
    setStatus("Ready to mint.");
    setDisabled(false);
  }

  subscribeWallet((next) => {
    walletState = next;
    updateEligibility();
  });

  document.addEventListener("nft-selection-change", () => {
    updateEligibility();
  });

  mintButton.addEventListener("click", async () => {
    if (!walletState || walletState.status !== "connected") {
      setStatus("Connect your wallet to mint.", "error");
      return;
    }
    if (state.nftSelection.length < 1 || state.nftSelection.length > 6) {
      setStatus("Select 1 to 6 NFTs to mint.", "error");
      return;
    }
    setDisabled(true);
    setStatus("Building provenance bundle...");
    try {
      const provider = new BrowserProvider(walletState.provider);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
        throw new Error("Switch wallet to Sepolia.");
      }
      const signer = await provider.getSigner();
      const contract = new Contract(
        ICECUBE_CONTRACT.address,
        ICECUBE_CONTRACT.abi,
        signer
      );
      const bundle = await buildProvenanceBundle(
        state.nftSelection,
        walletState.address,
        SEPOLIA_CHAIN_ID
      );
      const metadata = buildMintMetadata(state.nftSelection, bundle);
      const tokenUri = buildTokenUri(metadata);
      if (devChecklist) {
        const diagnostics = buildDiagnostics({
          selection: state.nftSelection,
          metadata,
          tokenUri,
          amountInput: amountInput.value,
          walletAddress: walletState.address,
        });
        logDiagnostics(diagnostics, devChecklist);
      }
      const refs = state.nftSelection.map((nft) => ({
        contractAddress: nft.contractAddress,
        tokenId: BigInt(nft.tokenId),
      }));
      const valueRaw = amountInput.value.trim();
      const overrides = valueRaw ? { value: parseEther(valueRaw) } : {};

      setStatus("Submitting mint transaction...");
      const tx = await contract.mint(tokenUri, refs, overrides);
      setStatus("Waiting for confirmation...");
      await tx.wait();
      setStatus("Mint confirmed.", "success");
    } catch (error) {
      setStatus(formatError(error), "error");
    } finally {
      setDisabled(false);
      updateEligibility();
    }
  });

  if (!amountInput.value) {
    const maxRoyalty = (MINT_PRICE * MINT_ROYALTY_BPS) / 10000;
    amountInput.value = (MINT_PRICE + maxRoyalty).toFixed(6);
  }

  updateEligibility();
}

function buildDiagnostics({ selection, metadata, tokenUri, amountInput, walletAddress }) {
  const royaltyTopup = (MINT_PRICE * MINT_ROYALTY_BPS) / 10000;
  const requiredTotal = MINT_PRICE + royaltyTopup;
  const selectionCount = selection.length;
  const perRefRoyalty =
    selectionCount > 0 ? (royaltyTopup * 0.6) / selectionCount : 0;

  return {
    walletAddress,
    selectionCount,
    economics: {
      mintPriceEth: MINT_PRICE,
      royaltyBps: MINT_ROYALTY_BPS,
      royaltyTopupEth: royaltyTopup,
      requiredTotalEth: requiredTotal,
      creatorShareEth: royaltyTopup * 0.2,
      lessTreasuryShareEth: royaltyTopup * 0.2,
      perRefShareEth: perRefRoyalty,
      amountInputEth: amountInput ? Number(amountInput) : null,
      assumesAllRefsImplementErc2981: true,
    },
    uris: {
      animationUrl: metadata.animation_url || null,
      image: metadata.image || null,
      tokenUri,
    },
  };
}

function logDiagnostics(diagnostics, devChecklist) {
  console.info("[icecube][mint] economics", diagnostics.economics);
  devChecklist.mark("economics");
  console.info("[icecube][mint] uris", diagnostics.uris);
  devChecklist.mark("uris");
  devChecklist.setPayload(diagnostics);
}

function initDevChecklist(container) {
  if (!container) {
    return {
      mark: () => {},
      setPayload: () => {},
    };
  }

  const section = document.createElement("div");
  section.className = "ui-section";

  const title = document.createElement("div");
  title.className = "ui-section-title";
  title.textContent = "Dev checklist";
  section.appendChild(title);

  const list = document.createElement("ul");
  list.style.margin = "8px 0 0";
  list.style.padding = "0 0 0 18px";

  const items = [
    { id: "economics", label: "Economics breakdown logged" },
    { id: "uris", label: "Final URIs logged" },
    { id: "copy", label: "Diagnostics copied" },
  ];

  const itemMap = new Map();
  items.forEach((item) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = item.label;
    li.appendChild(label);
    list.appendChild(li);
    itemMap.set(item.id, li);
  });

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ui-button is-ghost";
  button.textContent = "Copy diagnostics";
  button.style.marginTop = "10px";

  section.appendChild(list);
  section.appendChild(button);
  container.appendChild(section);

  let payload = null;

  function mark(id) {
    const item = itemMap.get(id);
    if (item && item.dataset.done !== "true") {
      item.textContent = `${item.textContent} (done)`;
      item.dataset.done = "true";
    }
  }

  async function copyDiagnostics() {
    if (!payload) {
      return;
    }
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      mark("copy");
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        mark("copy");
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  button.addEventListener("click", () => {
    copyDiagnostics();
  });

  return {
    mark,
    setPayload(next) {
      payload = next;
    },
  };
}
