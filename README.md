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

