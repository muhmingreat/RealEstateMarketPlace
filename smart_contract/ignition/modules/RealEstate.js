const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("RealEstateModule", (m) => {
  // Deploy RealEstate (it will deploy its internal NFT)
  const realEstate = m.contract("RealEstate", [], {
    afterDeploy: async (ctx) => {
      // The internal NFT address is stored in the propertyNFT state variable
      const nftAddress = await ctx.contract.propertyNFT();
      console.log("RealEstate deployed at:", ctx.contract.address);
      console.log("Internal RealEstateNFT deployed at:", nftAddress);
    },
  });

  return { realEstate };
});



// const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// module.exports = buildModule("RealEstateModule", (m) => {
//   // Deploy NFT first
//   const propertyNFT = m.contract("RealEstateNFT");

//   // Deploy RealEstate with the NFT address
//   const realEstate = m.contract("RealEstate", [propertyNFT], {
//     afterDeploy: async (ctx) => {
//       console.log("RealEstate deployed with NFT:", propertyNFT.address);
//     },
//   });

//   return { propertyNFT, realEstate };
// });




// const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// module.exports = buildModule("RealEstateModule", (m) => {
//   // Deploy NFT first
//   const propertyNFT = m.contract("RealEstateNFT");

//   // Deploy RealEstate and pass the NFT address if needed
//   const realEstate = m.contract("RealEstate", [], {
//     afterDeploy: async (ctx) => {
//       // Transfer NFT ownership to RealEstate contract so it can mint
//       await propertyNFT.transferOwnership(realEstate.address);
//       console.log("NFT ownership transferred to RealEstate:", realEstate.address);
//     },
//   });

//   return { propertyNFT, realEstate };
// });



// // const {buildModule} = require("@nomicfoundation/hardhat-ignition/modules");

// // module.exports = buildModule("RealEstate", (m) => {

// //   const realEstate = m.contract("RealEstate");
// //   return { realEstate,  };
// // });

