// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Test } from "forge-std/Test.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { IERC2981 } from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import { IERC165 } from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import { IceCubeMinter } from "../src/IceCubeMinter.sol";

contract MockERC721 is ERC721 {
    uint256 private _nextId = 1;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function mint(address to) external returns (uint256 tokenId) {
        tokenId = _nextId;
        _nextId += 1;
        _safeMint(to, tokenId);
    }
}

contract MockRoyaltyERC721 is ERC721, IERC2981 {
    uint256 private _nextId = 1;
    address private royaltyReceiver;

    constructor(string memory name_, string memory symbol_, address receiver_)
        ERC721(name_, symbol_)
    {
        royaltyReceiver = receiver_;
    }

    function mint(address to) external returns (uint256 tokenId) {
        tokenId = _nextId;
        _nextId += 1;
        _safeMint(to, tokenId);
    }

    function royaltyInfo(
        uint256,
        uint256 salePrice
    ) external view override returns (address, uint256) {
        return (royaltyReceiver, salePrice / 10);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
contract IceCubeMinterTest is Test {
    IceCubeMinter private minter;
    MockERC721 private nftA;
    MockERC721 private nftB;
    MockERC721 private nftC;
    MockRoyaltyERC721 private royaltyNft;

    address private owner = makeAddr("owner");
    address private creator = makeAddr("creator");
    address private lessTreasury = makeAddr("less");
    address private resaleSplitter = makeAddr("splitter");
    address private royaltyReceiver = makeAddr("royalty");
    uint256 private constant MINT_PRICE = 0.0027 ether;

    function setUp() public {
        vm.startPrank(owner);
        minter = new IceCubeMinter(
            creator,
            lessTreasury,
            resaleSplitter,
            500
        );
        vm.stopPrank();

        nftA = new MockERC721("NFT A", "NFTA");
        nftB = new MockERC721("NFT B", "NFTB");
        nftC = new MockERC721("NFT C", "NFTC");
        royaltyNft = new MockRoyaltyERC721("Royalty", "ROY", royaltyReceiver);
    }

    function _buildRefs(
        uint256 tokenA,
        uint256 tokenB,
        uint256 tokenC
    ) internal view returns (IceCubeMinter.NftRef[] memory refs) {
        refs = new IceCubeMinter.NftRef[](3);
        refs[0] = IceCubeMinter.NftRef({ contractAddress: address(nftA), tokenId: tokenA });
        refs[1] = IceCubeMinter.NftRef({ contractAddress: address(nftB), tokenId: tokenB });
        refs[2] = IceCubeMinter.NftRef({ contractAddress: address(nftC), tokenId: tokenC });
    }

    function testMintRequiresOwnership() public {
        address minterAddr = makeAddr("minter");
        uint256 tokenA = nftA.mint(minterAddr);
        uint256 tokenB = nftB.mint(minterAddr);
        uint256 tokenC = nftC.mint(address(0xBEEF));

        IceCubeMinter.NftRef[] memory refs = _buildRefs(tokenA, tokenB, tokenC);

        vm.prank(minterAddr);
        vm.expectRevert("Not owner of referenced NFT");
        minter.mint("ipfs://token", refs);
    }

    function testMintDistributesRoyalty() public {
        address minterAddr = makeAddr("minter");
        uint256 tokenA = nftA.mint(minterAddr);
        uint256 tokenB = nftB.mint(minterAddr);
        uint256 tokenC = royaltyNft.mint(minterAddr);

        IceCubeMinter.NftRef[] memory refs = new IceCubeMinter.NftRef[](3);
        refs[0] = IceCubeMinter.NftRef({ contractAddress: address(nftA), tokenId: tokenA });
        refs[1] = IceCubeMinter.NftRef({ contractAddress: address(nftB), tokenId: tokenB });
        refs[2] = IceCubeMinter.NftRef({ contractAddress: address(royaltyNft), tokenId: tokenC });

        uint256 amount = MINT_PRICE + (MINT_PRICE / 10 / 3);
        vm.deal(minterAddr, amount);

        vm.prank(minterAddr);
        minter.mint{ value: amount }("ipfs://token", refs);

        uint256 perRefRoyalty = (MINT_PRICE / 10) / 3;
        uint256 expectedCreator = (perRefRoyalty * 20) / 100;
        uint256 expectedLess = expectedCreator;
        uint256 expectedReceiver = (perRefRoyalty * 60) / 100;

        assertEq(creator.balance, expectedCreator);
        assertEq(lessTreasury.balance, expectedLess);
        assertEq(royaltyReceiver.balance, expectedReceiver);
    }

    function testMintSetsTokenUri() public {
        address minterAddr = makeAddr("minter");
        uint256 tokenA = nftA.mint(minterAddr);
        uint256 tokenB = nftB.mint(minterAddr);
        uint256 tokenC = nftC.mint(minterAddr);

        IceCubeMinter.NftRef[] memory refs = _buildRefs(tokenA, tokenB, tokenC);

        vm.deal(minterAddr, MINT_PRICE);
        vm.prank(minterAddr);
        uint256 tokenId = minter.mint{ value: MINT_PRICE }("ipfs://token", refs);

        assertEq(minter.ownerOf(tokenId), minterAddr);
        assertEq(minter.tokenURI(tokenId), "ipfs://token");
    }

    function testRoyaltyInfoDefaults() public {
        (address receiver, uint256 amount) = minter.royaltyInfo(1, 1 ether);
        assertEq(receiver, resaleSplitter);
        assertEq(amount, 0.05 ether);
    }

    function testMintRejectsEmptyRefs() public {
        IceCubeMinter.NftRef[] memory refs = new IceCubeMinter.NftRef[](0);

        vm.expectRevert("Invalid reference count");
        minter.mint("ipfs://token", refs);
    }

    function testMintRejectsTooManyRefs() public {
        IceCubeMinter.NftRef[] memory refs = new IceCubeMinter.NftRef[](7);

        vm.expectRevert("Invalid reference count");
        minter.mint("ipfs://token", refs);
    }

    function testMintRevertsOnTransferFailure() public {
        RevertingReceiver receiver = new RevertingReceiver();
        IceCubeMinter failingMinter = new IceCubeMinter(
            creator,
            address(receiver),
            resaleSplitter,
            500
        );

        address minterAddr = makeAddr("minter");
        uint256 tokenA = nftA.mint(minterAddr);
        uint256 tokenB = nftB.mint(minterAddr);
        uint256 tokenC = royaltyNft.mint(minterAddr);

        IceCubeMinter.NftRef[] memory refs = new IceCubeMinter.NftRef[](3);
        refs[0] = IceCubeMinter.NftRef({ contractAddress: address(nftA), tokenId: tokenA });
        refs[1] = IceCubeMinter.NftRef({ contractAddress: address(nftB), tokenId: tokenB });
        refs[2] = IceCubeMinter.NftRef({ contractAddress: address(royaltyNft), tokenId: tokenC });

        uint256 amount = MINT_PRICE + (MINT_PRICE / 10 / 3);
        vm.deal(minterAddr, amount);
        vm.prank(minterAddr);
        vm.expectRevert("Transfer failed");
        failingMinter.mint{ value: amount }("ipfs://token", refs);
    }

    function testMintRefundsExcessPayment() public {
        address minterAddr = makeAddr("minter");
        uint256 tokenA = nftA.mint(minterAddr);
        uint256 tokenB = nftB.mint(minterAddr);
        uint256 tokenC = royaltyNft.mint(minterAddr);

        IceCubeMinter.NftRef[] memory refs = new IceCubeMinter.NftRef[](3);
        refs[0] = IceCubeMinter.NftRef({ contractAddress: address(nftA), tokenId: tokenA });
        refs[1] = IceCubeMinter.NftRef({ contractAddress: address(nftB), tokenId: tokenB });
        refs[2] = IceCubeMinter.NftRef({ contractAddress: address(royaltyNft), tokenId: tokenC });

        uint256 required = MINT_PRICE + (MINT_PRICE / 10 / 3);
        uint256 amount = required + 0.001 ether;
        vm.deal(minterAddr, amount);

        vm.prank(minterAddr);
        minter.mint{ value: amount }("ipfs://token", refs);

        assertEq(minterAddr.balance, amount - required);
    }
}

contract RevertingReceiver {
    receive() external payable {
        revert("Nope");
    }
}
