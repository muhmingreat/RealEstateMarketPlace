const {buildModule} = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("mock", (m) => {

  const mockOracle = m.contract("MockOracle");
  return { mockOracle };
});
