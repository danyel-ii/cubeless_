import { postNftsApi } from "./nfts-api.js";

export async function alchemyGet<T>(
  chainId: number,
  path: string,
  query: Record<string, string | number | undefined | Array<string | number>>
): Promise<T> {
  const json = (await postNftsApi(
    {
      mode: "alchemy",
      chainId,
      path,
      query,
    },
    { errorLabel: "API request failed" }
  )) as T;
  return json;
}
