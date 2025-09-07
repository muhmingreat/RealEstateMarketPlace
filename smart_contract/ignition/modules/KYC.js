const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("KYC", (m) => {
  const kyc = m.contract("KYCVerifier");
  return { kyc };
});
