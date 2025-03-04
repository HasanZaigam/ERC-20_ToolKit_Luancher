require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks:{
    sepolia:{
      url:process.env.SEPOLIA_RPC_URL,
      accounts:[process.env.PRIVATE_KEY],
    },
    polygon:{
      url:process.env.POLYGON_RPC_URL,
      accounts:[process.env.PRIVATE_KEY],
    },
  },
  etherscan:{
    apiKey:{
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
    },
  },
};
