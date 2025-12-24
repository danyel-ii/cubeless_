// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC721URIStorage } from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { ERC2981 } from "@openzeppelin/contracts/token/common/ERC2981.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20Minimal } from "../interfaces/IERC20Minimal.sol";

contract IceCubeMinter is ERC721URIStorage, ERC2981, Ownable, ReentrancyGuard {
    struct NftRef {
        address contractAddress;
        uint256 tokenId;
    }

    uint96 public constant RESALE_ROYALTY_BPS_DEFAULT = 500; // 5%
    uint256 public constant BASE_PRICE_WEI = 777_000_000_000_000;
    uint256 public constant ONE_BILLION = 1_000_000_000e18;
    uint256 public constant WAD = 1e18;

    uint256 private _nextTokenId = 1;

    address public immutable lessToken;
    address public resaleSplitter;

    event Minted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    event RoyaltyReceiverUpdated(address resaleSplitter);

    constructor(address resaleSplitter_, address lessToken_, uint96 resaleRoyaltyBps)
        ERC721("IceCube", "ICECUBE")
        Ownable(msg.sender)
    {
        require(resaleSplitter_ != address(0), "Resale splitter required");
        require(lessToken_ != address(0), "LESS token required");
        require(resaleRoyaltyBps <= 1000, "Royalty too high");
        resaleSplitter = resaleSplitter_;
        lessToken = lessToken_;

        _setDefaultRoyalty(resaleSplitter_, resaleRoyaltyBps);
    }

    function mint(
        string calldata tokenURI,
        NftRef[] calldata refs
    ) external payable nonReentrant returns (uint256 tokenId) {
        // Revert if refs length is outside 1..6 to prevent ambiguous split math.
        require(refs.length >= 1 && refs.length <= 6, "Invalid reference count");

        for (uint256 i = 0; i < refs.length; i += 1) {
            address nftOwner = IERC721(refs[i].contractAddress).ownerOf(refs[i].tokenId);
            require(nftOwner == msg.sender, "Not owner of referenced NFT");
        }

        uint256 price = currentMintPrice();
        require(msg.value >= price, "INSUFFICIENT_ETH");

        tokenId = _nextTokenId;
        _nextTokenId += 1;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit Minted(msg.sender, tokenId, tokenURI);

        _transferEth(owner(), price);

        if (msg.value > price) {
            _transferEth(msg.sender, msg.value - price);
        }
    }

    function currentMintPrice() public view returns (uint256) {
        uint256 supply = IERC20Minimal(lessToken).totalSupply();
        if (supply > ONE_BILLION) {
            supply = ONE_BILLION;
        }
        uint256 delta = ONE_BILLION - supply;
        uint256 factorWad = WAD + (delta * WAD) / ONE_BILLION;
        return (BASE_PRICE_WEI * factorWad) / WAD;
    }

    function setRoyaltyReceiver(address resaleSplitter_) external onlyOwner {
        require(resaleSplitter_ != address(0), "Resale splitter required");
        resaleSplitter = resaleSplitter_;
        _setDefaultRoyalty(resaleSplitter_, RESALE_ROYALTY_BPS_DEFAULT);

        emit RoyaltyReceiverUpdated(resaleSplitter_);
    }

    function setResaleRoyalty(uint96 bps, address receiver) external onlyOwner {
        require(receiver != address(0), "Receiver required");
        require(bps <= 1000, "Royalty too high");
        _setDefaultRoyalty(receiver, bps);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _transferEth(address recipient, uint256 amount) internal {
        if (amount == 0) {
            return;
        }
        (bool success, ) = recipient.call{ value: amount }("");
        require(success, "Transfer failed");
    }
}
