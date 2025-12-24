const TOTAL_SUPPLY_SELECTOR = "0x18160ddd";

function getAlchemyRpcUrl() {
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_ALCHEMY_API_KEY.");
  }
  return `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`;
}

function getLessTokenAddress() {
  return (
    import.meta.env.VITE_LESS_TOKEN_ADDRESS ||
    "0x9c2ca573009f181eac634c4d6e44a0977c24f335"
  );
}

export async function fetchLessTotalSupply() {
  const url = getAlchemyRpcUrl();
  const token = getLessTokenAddress();
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "eth_call",
    params: [
      {
        to: token,
        data: TOTAL_SUPPLY_SELECTOR,
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
    throw new Error(`LESS supply fetch failed (${response.status}).`);
  }
  const json = await response.json();
  if (!json?.result) {
    throw new Error("LESS supply response missing result.");
  }
  return BigInt(json.result);
}
