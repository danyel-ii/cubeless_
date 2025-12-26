// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RoyaltySplitter is Ownable, ReentrancyGuard {
    address public immutable lessToken;
    address public immutable burnAddress;
    address public router;
    bytes public swapCalldata;

    error LessTokenRequired();
    error SwapCalldataRequiresRouter();
    error EthTransferFailed(address recipient, uint256 amount);

    event RouterUpdated(address router, bytes swapCalldata);

    constructor(
        address owner_,
        address lessToken_,
        address router_,
        bytes memory swapCalldata_,
        address burnAddress_
    ) Ownable(owner_) {
        require(owner_ != address(0), "Owner required");
        require(burnAddress_ != address(0), "Burn address required");
        if (lessToken_ == address(0)) {
            revert LessTokenRequired();
        }
        if (router_ == address(0) && swapCalldata_.length != 0) {
            revert SwapCalldataRequiresRouter();
        }
        lessToken = lessToken_;
        router = router_;
        swapCalldata = swapCalldata_;
        burnAddress = burnAddress_;
    }

    receive() external payable nonReentrant {
        _handleRoyalty();
    }

    fallback() external payable nonReentrant {
        _handleRoyalty();
    }

    function setRouter(address router_, bytes calldata swapCalldata_) external onlyOwner {
        if (router_ == address(0) && swapCalldata_.length != 0) {
            revert SwapCalldataRequiresRouter();
        }
        router = router_;
        swapCalldata = swapCalldata_;
        emit RouterUpdated(router_, swapCalldata_);
    }

    function _handleRoyalty() internal {
        uint256 amount = msg.value;
        if (amount == 0) {
            return;
        }

        if (router == address(0)) {
            _send(owner(), amount);
            return;
        }

        uint256 half = amount / 2;
        (bool ok, ) = router.call{ value: half }(swapCalldata);
        if (!ok) {
            _send(owner(), amount);
            return;
        }

        _forwardLess();
        _send(owner(), address(this).balance);
    }

    function _forwardLess() internal {
        uint256 lessBalance = IERC20(lessToken).balanceOf(address(this));
        if (lessBalance == 0) {
            return;
        }
        uint256 burnAmount = lessBalance / 2;
        uint256 ownerAmount = lessBalance - burnAmount;
        if (burnAmount > 0) {
            bool burned = IERC20(lessToken).transfer(burnAddress, burnAmount);
            require(burned, "LESS burn transfer failed");
        }
        if (ownerAmount > 0) {
            bool success = IERC20(lessToken).transfer(owner(), ownerAmount);
            require(success, "LESS transfer failed");
        }
    }

    function _send(address recipient, uint256 amount) internal {
        if (amount == 0) {
            return;
        }
        (bool success, ) = recipient.call{ value: amount }("");
        if (!success) {
            revert EthTransferFailed(recipient, amount);
        }
    }
}
