// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { VRFCoordinatorV2_5Interface } from "../../src/chainlink/VRFCoordinatorV2_5Interface.sol";
import { VRFV2PlusClient } from "../../src/chainlink/VRFV2PlusClient.sol";

contract MockVRFCoordinatorV2 is VRFCoordinatorV2_5Interface {
    uint256 private _nextRequestId = 1;

    function requestRandomWords(
        VRFV2PlusClient.RandomWordsRequest calldata
    ) external override returns (uint256 requestId) {
        requestId = _nextRequestId;
        _nextRequestId += 1;
    }
}
