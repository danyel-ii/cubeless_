// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { VRFCoordinatorV2Interface } from "../../src/chainlink/VRFCoordinatorV2Interface.sol";

contract MockVRFCoordinatorV2 is VRFCoordinatorV2Interface {
    uint256 private _nextRequestId = 1;

    function requestRandomWords(
        bytes32,
        uint64,
        uint16,
        uint32,
        uint32
    ) external override returns (uint256 requestId) {
        requestId = _nextRequestId;
        _nextRequestId += 1;
    }
}
