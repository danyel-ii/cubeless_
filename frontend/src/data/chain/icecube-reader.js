import { Interface } from "ethers";
import { ICECUBE_CONTRACT } from "../../config/contracts";

function getAlchemyRpcUrl(chainId) {
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_ALCHEMY_API_KEY.");
  }
  if (chainId === 11155111) {
    return `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`;
  }
  if (chainId === 1) {
    return `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
  }
  throw new Error("Unsupported chain for token view.");
}

export async function fetchTokenUri(tokenId) {
  if (!ICECUBE_CONTRACT.address || ICECUBE_CONTRACT.address === "0x0000000000000000000000000000000000000000") {
    throw new Error("Contract address not configured.");
  }
  const chainId = ICECUBE_CONTRACT.chainId;
  const url = getAlchemyRpcUrl(chainId);
  const iface = new Interface(ICECUBE_CONTRACT.abi);
  const data = iface.encodeFunctionData("tokenURI", [tokenId]);
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [
      {
        to: ICECUBE_CONTRACT.address,
        data,
      },
      "latest",
    ],
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`tokenURI fetch failed (${response.status}).`);
  }
  const json = await response.json();
  if (!json?.result) {
    throw new Error("tokenURI response missing result.");
  }
  const decoded = iface.decodeFunctionResult("tokenURI", json.result);
  return decoded?.[0] ?? null;
}
