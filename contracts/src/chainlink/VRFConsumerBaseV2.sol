// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract VRFConsumerBaseV2 {
    error OnlyCoordinatorCanFulfill(address have, address want);

    address private immutable _vrfCoordinator;

    constructor(address vrfCoordinator) {
        _vrfCoordinator = vrfCoordinator;
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal virtual;

    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external {
        if (msg.sender != _vrfCoordinator) {
            revert OnlyCoordinatorCanFulfill(msg.sender, _vrfCoordinator);
        }
        fulfillRandomWords(requestId, randomWords);
    }
}
