require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */


const { PRIVATE_KEY, ALCHEMY_RPC_URL } = process.env;
module.exports = {
  defaultNetwork: "celoSepolia",
  networks: {
    hardhat: {
    },
    celoSepolia: {
      url: `https://celo-sepolia.g.alchemy.com/v2/${ALCHEMY_RPC_URL}`,
      // ALCHEMY_RPC_URL,
     
      accounts: [`0x${PRIVATE_KEY}`]
    }
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  mocha: {
    timeout: 40000
  }
}


