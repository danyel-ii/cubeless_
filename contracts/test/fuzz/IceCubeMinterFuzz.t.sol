// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";
import { IceCubeMinter } from "../../src/icecube/IceCubeMinter.sol";
import { MockERC721Standard } from "../mocks/MockERC721s.sol";
import { MockERC20 } from "../mocks/MockERC20.sol";
import { Refs } from "../helpers/Refs.sol";

contract IceCubeMinterFuzzTest is Test {
    IceCubeMinter private minter;
    MockERC721Standard private nft;
    MockERC20 private lessToken;
    address private owner = makeAddr("owner");
    address private resaleSplitter = makeAddr("splitter");

    function _commitMint(
        address minterAddr,
        bytes32 salt,
        IceCubeMinter.NftRef[] memory refs
    ) internal {
        bytes32 refsHash = Refs.hashCanonical(refs);
        vm.prank(minterAddr);
        minter.commitMint(salt, refsHash);
        vm.roll(block.number + 1);
    }

    function setUp() public {
        vm.startPrank(owner);
        lessToken = new MockERC20("LESS", "LESS");
        minter = new IceCubeMinter(resaleSplitter, address(lessToken), 500);
        vm.stopPrank();
        nft = new MockERC721Standard("MockNFT", "MNFT");
    }

    function _buildRefs(address minterAddr, uint8 count) internal returns (IceCubeMinter.NftRef[] memory refs) {
        refs = new IceCubeMinter.NftRef[](count);
        for (uint256 i = 0; i < count; i += 1) {
            uint256 tokenId = nft.mint(minterAddr);
            refs[i] = IceCubeMinter.NftRef({
                contractAddress: address(nft),
                tokenId: tokenId
            });
        }
    }

    function testFuzz_PaymentBoundary(uint256 paymentRaw, uint8 countRaw) public {
        uint8 count = uint8(bound(countRaw, 1, 6));
        uint256 payment = bound(paymentRaw, 0, 1 ether);
        address minterAddr = makeAddr("minter");
        uint256 price = minter.currentMintPrice();

        IceCubeMinter.NftRef[] memory refs = _buildRefs(minterAddr, count);
        bytes32 salt = keccak256(abi.encodePacked(minterAddr, count, payment));
        vm.deal(minterAddr, payment);

        if (payment < price) {
            _commitMint(minterAddr, salt, refs);
            vm.prank(minterAddr);
            vm.expectRevert(IceCubeMinter.InsufficientEth.selector);
            minter.mint{ value: payment }(salt, "ipfs://token", refs);
            return;
        }

        uint256 splitterBefore = resaleSplitter.balance;
        uint256 minterBefore = minterAddr.balance;
        _commitMint(minterAddr, salt, refs);
        vm.prank(minterAddr);
        minter.mint{ value: payment }(salt, "ipfs://token", refs);

        assertEq(resaleSplitter.balance, splitterBefore + price);
        assertEq(minterAddr.balance, minterBefore - price);
    }

    function testFuzz_OwnershipGate(uint8 countRaw, bool injectWrongOwner) public {
        uint8 count = uint8(bound(countRaw, 1, 6));
        address minterAddr = makeAddr("minter");
        address other = makeAddr("other");

        IceCubeMinter.NftRef[] memory refs = _buildRefs(minterAddr, count);
        uint256 wrongTokenId = 0;
        if (injectWrongOwner) {
            wrongTokenId = nft.mint(other);
            refs[count - 1].tokenId = wrongTokenId;
        }

        uint256 price = minter.currentMintPrice();
        vm.deal(minterAddr, price);
        _commitMint(minterAddr, keccak256("salt"), refs);
        vm.prank(minterAddr);
        if (injectWrongOwner) {
            vm.expectRevert(
                abi.encodeWithSelector(
                    IceCubeMinter.RefNotOwned.selector,
                    address(nft),
                    wrongTokenId,
                    minterAddr,
                    other
                )
            );
            minter.mint{ value: price }(keccak256("salt"), "ipfs://token", refs);
            return;
        }
        minter.mint{ value: price }(keccak256("salt"), "ipfs://token", refs);
    }
}
