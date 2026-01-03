import { solidityPackedKeccak256 } from "ethers";

export function sortRefsCanonically(refs) {
  return [...refs].sort((a, b) => {
    const addrA = BigInt(a.contractAddress);
    const addrB = BigInt(b.contractAddress);
    if (addrA < addrB) {
      return -1;
    }
    if (addrA > addrB) {
      return 1;
    }
    if (a.tokenId < b.tokenId) {
      return -1;
    }
    if (a.tokenId > b.tokenId) {
      return 1;
    }
    return 0;
  });
}

export function computeRefsHash(refs) {
  const types = [];
  const values = [];
  refs.forEach((ref) => {
    types.push("address", "uint256");
    values.push(ref.contractAddress, ref.tokenId);
  });
  return solidityPackedKeccak256(types, values);
}
