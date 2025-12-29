import deployment from "../../../../contracts/deployments/mainnet.json";
import abi from "../../../../contracts/abi/IceCubeMinter.json";

export const ICECUBE_CONTRACT = {
  chainId: deployment.chainId,
  address: deployment.address,
  abi,
};
