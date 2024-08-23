

# Dark Forest v0.3 (2024 version)

Let’s revisit the summer of 2020 together.

We ([DFArchon](https://x.com/DFArchon)) have updated the smart contracts and development environment for the 2024 version.

This work is a step toward our upcoming goal of porting Dark Forest to MUD 🦑.

To bring our future development plans to life, we are seeking both funding and developers.

We warmly invite you to reach out and connect with us.

Thank you for your support.

Discord: https://discord.gg/XpBPEnsvgX

Telegram: https://t.me/darkforestares


## todo

1. support redstone mainnet 
2. Add a game parameter configuration module



## How to run locally



#### Installing The Correct Node Version Using NVM

The smart contract part requires Node.js v18, while the client part requires Node.js v16

We recommend using NVM to switch between multiple Node.js version on your machine.

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
nvm install
```

After the installation is finished, you can run `node --version` to verify that you are running v14 or v16



### 1. local node & contracts

```
open eth/ 
nvm use 18 // make sure the node version is 18
npm install // NOTE: please use npm to install the dependencies, use yarn will have bugs
npx hardhat node 
npx hardhat --network localhost deploy --whitelist false // open another terminal to deploy
```

### 2. client 

```
nvm use 16 // open another terminal to handle client 
npm install 
npm run start:dev 
```

Congratulations, you can now enter the game!  





# Dark Forest

Dark Forest is an massively multiplayer online real-time strategy (MMORTS) space conquest game build on top of the Ethereum blockchain.

## Project Structure

The Dark Forest repository is composed of three main components"

1. `/client` contains the game's user interface
2. `/eth` contains the game's smart contract code
3. `/circuits` contains the game's zkSNARKS circuits writen in [Circom](https://github.com/iden3/circom)

## Development Guide

### Installing Core Dependencies

-   Node (v12.18.0)
-   Yarn (Javascript Package Manager)
-   Ganache CLI

#### Installing The Correct Node Version Using NVM

Dark Forest is built and tested using Node.js v12.18.0 and might not run properly on other Node.js versions. We recommend using NVM to switch between multiple Node.js version on your machine.

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
nvm install
```

After the installation is finished, you can run `node --version` to verify that you are running v12.18.0

#### Installing Yarn & Other Dev Dependencies

Refer to [Yarn's official documentation](https://classic.yarnpkg.com/en/docs/install) for the installation guide.

After you have Yarn installed, run the following commands in the root director install the remaining dev depencies:

```
yarn global add ganache-cli
yarn install
```

### Client Development Setup

All of our client related code are located in the `/client` directory.

Currently, after following the setup below, you will be able to have a locally running client that will point towards the current playtest contract on Ropsten. The production contract address is stored in `/client/src/utils/prod_contract_addr.ts`.

**Navigate to the `/client` folder and run the following commands:**

```
yarn install
yarn start:prod
```

### Smart Contract Development Setup

All of our smartcontract related code are located in the `/eth` directory.

-   `/eth/contracts` contains the smartcontract code written in solidity
-   `/eth/test` contains the test for the smartcontract written in Javascript

#### Installing Dependenciees

**Navigate to the `/eth` folder and run the following commands:**

```
yarn add scrypt
yarn install
```

Note: We run `yarn add scrypt` as a hack too solve a node-gyp error that a lot of our developers have encountered.

#### Running Tests

```
yarn test
```

#### Deploying Contracts Locally

We use [OpenZeppelin CLI](https://docs.openzeppelin.com/cli/2.8/) to manage the deployment our contracts instead of using Truffle. We use it because it works out of the box with OpenZeppelin upgradeable contract system.

You can easily deploy contract locally by running the local deployment at the project root directory:

Note: You will need ganache-cli for this to run properly.

```
./local-deploy.sh
```

For more information regarding Dark Forest's smart contract architecture, see the README.md file inside the `/eth` directory.

### Circuits Development Setup

TODO
