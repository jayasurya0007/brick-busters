require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      // optional: add other versions you need
      {
        version: "0.8.20",
      },
    ],
  },
  networks: {
    kadenaTestnetChain20: {
      url: "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc",
      chainId: 5920,
      accounts: [process.env.PRIVATE_KEY],
    },
    citrea: {
      url: process.env.CITREA_RPC_URL,
      chainId:5115,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
