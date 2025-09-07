// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IKYCVerifier {
    function isKYCApproved(address user) external view returns (bool);
}
