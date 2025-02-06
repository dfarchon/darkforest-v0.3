# Dark Forest v0.3 (2025)

A revival of the legendary 2020 Dark Forest game, updated for 2025. Dark Forest is a massively multiplayer online real-time strategy (MMORTS) space conquest game built on the Ethereum blockchain.

## 🚀 Quick Start

### Prerequisites

- nvm (Node Version Manager)
- Node.js v18.19.1 (Required for both smart contracts and client)
- npm 10.2.4 (Do not use yarn - there are known compatibility issues)


### Installing NVM
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
```

### Setting Up the Project

1. **Smart Contracts Setup**
```bash
cd eth/
nvm use 18.19.1 
npm install
cp .env.example .env
npx hardhat node
# In a new terminal:
npx hardhat --network localhost deploy --whitelist false
```

2. **Client Setup**
```bash
cd client/
nvm use 18.19.1 
npm install
npm run start:dev
```

The game should now be running at `http://localhost:8081`!

## 🏗️ Project Structure

- `/client` - Game UI and frontend logic
- `/eth` - Smart contract code
- `/circuits` - zkSNARKS circuits (using Circom)


## 🤝 Contributing

We're actively seeking both funding and developers to help bring our future development plans to life.

## 📞 Connect With Us

- DFArchon Discord: [Join our server](https://discord.gg/XpBPEnsvgX)
- DFArchon Telegram: [Join our channel](https://t.me/darkforestares)



# Change Log

the differences between the original v0.3 and the 2025 version.


In the 2025 update, we first upgraded the Node.js version from 12 to 18. Based on this, we accordingly updated the smart contracts and front-end dependencies.

We migrated the smart contract development environment from Ganache and Truffle to Hardhat. Leveraging the Hardhat framework, we also updated the deployment scripts.

For the smart contracts, we upgraded the Solidity version from 0.6 to 0.8 and updated the primary OpenZeppelin dependency to version 4.8. Additionally, we refined the contract details in accordance with the language features of different Solidity versions.

On the front end, we updated the dependencies while keeping the overall logic unchanged.

