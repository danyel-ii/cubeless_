// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { VRFV2PlusClient } from "./VRFV2PlusClient.sol";

interface VRFCoordinatorV2_5Interface {
    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata request
    ) external returns (uint256 requestId);
}
