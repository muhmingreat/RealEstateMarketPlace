// contracts/mocks/MockOracle.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IRealEstate {
    function fulfill(bytes32 requestId, bool verified, bytes32 docHash) external;
}

contract MockOracle {
    event MockRequest(bytes32 indexed requestId, uint256 propertyId, string docsHash);

    function mockRequestDocs(uint256 propertyId, string calldata docsHash) external returns (bytes32) {
        // Generate pseudo requestId
        bytes32 requestId = keccak256(abi.encodePacked(propertyId, docsHash, block.timestamp));
        emit MockRequest(requestId, propertyId, docsHash);
        return requestId;
    }

    function fulfillRequest(
        address realEstate,
        bytes32 requestId,
        bool verified,
        bytes32 docHash
    ) external {
        IRealEstate(realEstate).fulfill(requestId, verified, docHash);
    }
}
