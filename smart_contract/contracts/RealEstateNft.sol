// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @notice NFT contract for RealEstate properties, mintable only by the RealEstate contract
contract RealEstateNFT is ERC721URIStorage {
    uint256 public nextTokenId;
    address public minter; // RealEstate contract

    constructor() ERC721("Real Estate Property", "PROP") {}

    /// @notice Set the allowed minter (RealEstate contract)
    function setMinter(address _minter) external {
        require(minter == address(0), "Minter already set");
        minter = _minter;
    }

    /// @notice Mint a new property NFT, only callable by the RealEstate contract
    function mintProperty(address to, string memory metadataURI) external returns (uint256) {
        require(msg.sender == minter, "Not allowed");
        uint256 tokenId = ++nextTokenId;
        _mint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        return tokenId;
    }
}



