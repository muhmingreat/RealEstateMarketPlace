// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KYCVerifier
 * @dev Admin-controlled KYC approvals used by ContractEstate
 */
contract KYCVerifier {
    address public admin;
    mapping(address => bool) private approved;

    event KYCStatusChanged(address indexed user, bool approved);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function setKYCApproved(address user, bool status) external onlyAdmin {
        approved[user] = status;
        emit KYCStatusChanged(user, status);
    }

    function isKYCApproved(address user) external view returns (bool) {
        return approved[user];
    }
}
