// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { RoyaltySplitter } from "../src/royalties/RoyaltySplitter.sol";
import { ReceiverRevertsOnReceive } from "./mocks/Receivers.sol";

contract RevertingRouter {
    fallback() external payable {
        revert("Swap failed");
    }
}

contract MockLess is ERC20 {
    constructor() ERC20("LESS", "LESS") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SuccessfulRouter {
    MockLess public immutable less;
    uint256 public immutable mintAmount;

    constructor(MockLess less_, uint256 mintAmount_) {
        less = less_;
        mintAmount = mintAmount_;
    }

    fallback() external payable {
        less.mint(msg.sender, mintAmount);
    }
}

contract RoyaltySplitterTest is Test {
    address private owner = makeAddr("owner");
    address private burn = address(0x000000000000000000000000000000000000dEaD);
    event RouterUpdated(address router, bytes swapCalldata);

    function testForwardsAllWhenRouterUnset() public {
        RoyaltySplitter splitter = new RoyaltySplitter(owner, address(0), address(0), "", burn);
        vm.deal(address(this), 1 ether);

        (bool ok, ) = address(splitter).call{ value: 1 ether }("");
        assertTrue(ok);
        assertEq(owner.balance, 1 ether);
    }

    function testFallbackWithCalldataForwardsWhenRouterUnset() public {
        RoyaltySplitter splitter = new RoyaltySplitter(owner, address(0), address(0), "", burn);
        vm.deal(address(this), 1 ether);

        (bool ok, ) = address(splitter).call{ value: 1 ether }(hex"1234");
        assertTrue(ok);
        assertEq(owner.balance, 1 ether);
    }

    function testSetRouterUpdatesStateAndEmits() public {
        RoyaltySplitter splitter = new RoyaltySplitter(owner, address(0), address(0), "", burn);
        bytes memory calldataBlob = hex"deadbeef";

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit RouterUpdated(address(0xBEEF), calldataBlob);
        splitter.setRouter(address(0xBEEF), calldataBlob);

        assertEq(splitter.router(), address(0xBEEF));
        assertEq(splitter.swapCalldata(), calldataBlob);
    }

    function testForwardLessSkipsWhenBalanceZero() public {
        MockLess less = new MockLess();
        SuccessfulRouter router = new SuccessfulRouter(less, 0);
        RoyaltySplitter splitter = new RoyaltySplitter(
            owner,
            address(less),
            address(router),
            hex"deadbeef",
            burn
        );

        vm.deal(address(this), 2 ether);
        (bool ok, ) = address(splitter).call{ value: 2 ether }("");
        assertTrue(ok);
        assertEq(less.balanceOf(owner), 0);
        assertEq(less.balanceOf(burn), 0);
    }

    function testForwardsAllWhenSwapReverts() public {
        RevertingRouter router = new RevertingRouter();
        RoyaltySplitter splitter = new RoyaltySplitter(
            owner,
            address(0),
            address(router),
            hex"deadbeef",
            burn
        );

        vm.deal(address(this), 2 ether);
        (bool ok, ) = address(splitter).call{ value: 2 ether }("");
        assertTrue(ok);
        assertEq(owner.balance, 2 ether);
    }

    function testForwardsLessAndEthOnSwapSuccess() public {
        MockLess less = new MockLess();
        SuccessfulRouter router = new SuccessfulRouter(less, 250 ether);
        RoyaltySplitter splitter = new RoyaltySplitter(
            owner,
            address(less),
            address(router),
            hex"deadbeef",
            burn
        );

        vm.deal(address(this), 2 ether);
        (bool ok, ) = address(splitter).call{ value: 2 ether }("");
        assertTrue(ok);
        assertEq(owner.balance, 1 ether);
        assertEq(less.balanceOf(owner), 125 ether);
        assertEq(less.balanceOf(burn), 125 ether);
    }

    function testRevertsWhenOwnerCannotReceiveEth() public {
        ReceiverRevertsOnReceive receiver = new ReceiverRevertsOnReceive();
        RoyaltySplitter splitter = new RoyaltySplitter(
            address(receiver),
            address(0),
            address(0),
            "",
            burn
        );

        vm.deal(address(this), 1 ether);
        vm.expectRevert("Transfer failed");
        address(splitter).call{ value: 1 ether }("");
    }
}
