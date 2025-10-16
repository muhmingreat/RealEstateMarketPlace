// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/
contract RealEstateNFT is ERC721URIStorage, ERC721Burnable {
    uint256 public nextTokenId;
    address public minter; 

    constructor() ERC721("Real Estate Property", "PROP") {}

    
    function setMinter(address _minter) external {
        require(minter == address(0), "Minter already set");
        minter = _minter;
    }

    
    function mintProperty(address to, string memory metadataURI) external returns (uint256) {
        require(msg.sender == minter, "Not allowed");
        uint256 tokenId = ++nextTokenId;
        _mint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        return tokenId;
    }


    function burn(uint256 tokenId) public override {
        require(msg.sender == minter, "Only RealEstate contract can burn");
        super.burn(tokenId);
    }


    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}


 




