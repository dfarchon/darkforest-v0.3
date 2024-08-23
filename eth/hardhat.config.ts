import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "./tasks/deploy";

const config: HardhatUserConfig = {
  defaultNetwork: "localhost",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545/",
      accounts: {
        // Same mnemonic used in the .env.example
        mnemonic:
          "change typical hire slam amateur loan grid fix drama electric seed label",
      },
      chainId: 31337,
    },
    // Used when you dont specify a network on command line, like in tests
    hardhat: {
      accounts: {
        // Same mnemonic used in the .env.example
        mnemonic:
          "change typical hire slam amateur loan grid fix drama electric seed label",
      },
      blockGasLimit: 16777215,
      mining: {
        auto: false,
        interval: 1000,
      },
    },
  },
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
};

export default config;
