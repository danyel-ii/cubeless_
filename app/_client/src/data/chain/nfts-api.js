export async function postNftsApi(payload, { errorLabel = "API request failed", signal } = {}) {
  const response = await fetch("/api/nfts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) {
    throw new Error(`${errorLabel} (${response.status}).`);
  }
  return response.json();
}
