import { BrowserProvider, Contract, Interface } from "ethers";
import { ICECUBE_CONTRACT } from "../../config/contracts";

const SEPOLIA_CHAIN_ID = 11155111;

function isZeroAddress(address) {
  return !address || address === "0x0000000000000000000000000000000000000000";
}

export async function fetchLessDelta(provider, tokenId) {
  if (tokenId === null || tokenId === undefined) {
    return null;
  }
  if (isZeroAddress(ICECUBE_CONTRACT.address) || !ICECUBE_CONTRACT.abi?.length) {
    return null;
  }
  if (!provider) {
    return fetchLessDeltaFromRpc(tokenId);
  }
  const browserProvider = new BrowserProvider(provider);
  const network = await browserProvider.getNetwork();
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
    return null;
  }
  const contract = new Contract(
    ICECUBE_CONTRACT.address,
    ICECUBE_CONTRACT.abi,
    browserProvider
  );
  const [supplyNow, deltaFromLast, deltaFromMint] = await Promise.all([
    contract.lessSupplyNow(),
    contract.deltaFromLast(tokenId),
    contract.deltaFromMint(tokenId),
  ]);
  return {
    supplyNow: BigInt(supplyNow),
    deltaFromLast: BigInt(deltaFromLast),
    deltaFromMint: BigInt(deltaFromMint),
  };
}

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
  throw new Error("Unsupported chain for delta fetch.");
}

async function rpcCall(url, to, data) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [
      {
        to,
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
    throw new Error(`RPC call failed (${response.status}).`);
  }
  const json = await response.json();
  if (!json?.result) {
    throw new Error("RPC response missing result.");
  }
  return json.result;
}

async function fetchLessDeltaFromRpc(tokenId) {
  const url = getAlchemyRpcUrl(ICECUBE_CONTRACT.chainId);
  const iface = new Interface(ICECUBE_CONTRACT.abi);
  const supplyData = iface.encodeFunctionData("lessSupplyNow");
  const lastData = iface.encodeFunctionData("deltaFromLast", [tokenId]);
  const mintData = iface.encodeFunctionData("deltaFromMint", [tokenId]);

  const [supplyRaw, lastRaw, mintRaw] = await Promise.all([
    rpcCall(url, ICECUBE_CONTRACT.address, supplyData),
    rpcCall(url, ICECUBE_CONTRACT.address, lastData),
    rpcCall(url, ICECUBE_CONTRACT.address, mintData),
  ]);

  const supplyNow = iface.decodeFunctionResult("lessSupplyNow", supplyRaw)[0];
  const deltaFromLast = iface.decodeFunctionResult("deltaFromLast", lastRaw)[0];
  const deltaFromMint = iface.decodeFunctionResult("deltaFromMint", mintRaw)[0];

  return {
    supplyNow: BigInt(supplyNow),
    deltaFromLast: BigInt(deltaFromLast),
    deltaFromMint: BigInt(deltaFromMint),
  };
}
