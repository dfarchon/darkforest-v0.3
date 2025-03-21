import * as fs from "fs";
import { subtask, task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment, Libraries } from "hardhat/types";
import * as path from "path";
import * as prettier from "prettier";
import { promisify } from "util";
import { exec as rawExec } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const writeEnv = (filename: string, dict: Record<string, string>): void => {
  const str = Object.entries(dict)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  fs.writeFileSync(filename, str);
};

// Define an async function to execute shell commands
const exec = async (command: string): Promise<string> => {
  try {
    // Use promisify to convert rawExec into a promise-based function
    const { stdout, stderr } = await promisify(rawExec)(command);
    console.log(">> ", command);

    // Log stderr if it exists, though the command may still succeed
    if (stderr) {
      console.error(`Command ${command} produced stderr: ${stderr}`);
    }

    // Return the trimmed stdout result
    return stdout.trim();
  } catch (error) {
    // Log the error and rethrow it to allow handling by the caller
    console.error(`Command ${command} failed with error ${error}`);
    throw error;
  }
};

task("deploy", "deploy all contracts")
  .addOptionalParam(
    "fund",
    "amount of eth to fund whitelist contract for fund",
    0.5,
    types.float,
  )
  .setAction(deploy);

function loadGameConfig(): any {
  const configPath = path.join(__dirname, '../config/gameConfig.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config;
}

async function deploy(
  args: { fund: number },
  hre: HardhatRuntimeEnvironment,
) {
  console.log("\n🚀 Starting Dark Forest deployment...");
  console.log("--------------------");
  console.log(`Network: ${hre.network.name}`);

  const isDev = hre.network.name === "hardhat" || hre.network.name === "localhost";
  console.log(`Environment: ${isDev ? "Development" : "Production"}`);

  // Load game configuration
  const gameConfig = loadGameConfig();

  // Check environment variables
  console.log("\n📋 Checking environment variables...");
  const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC;
  const PROJECT_ID = process.env.PROJECT_ID;
  const DISABLE_ZK_CHECKS = gameConfig.DISABLE_ZK_CHECK;
  const NETWORK_URL = process.env.NETWORK_URL;

  if (
    !DEPLOYER_MNEMONIC ||
    DISABLE_ZK_CHECKS === undefined ||
    !NETWORK_URL ||
    PROJECT_ID === undefined
  ) {
    console.error("environment variables not found!");

    console.log("DEPLOYER_MNEMONIC");
    console.log(DEPLOYER_MNEMONIC);
    console.log("DISABLE_ZK_CHECKS");
    console.log(DISABLE_ZK_CHECKS);
    console.log("NETWORK_URL");
    console.log(NETWORK_URL);
    console.log("PROJECT_ID");
    console.log(PROJECT_ID);
    throw "";
  }

  const whitelistEnabled = gameConfig.whitelistEnabled;

  console.log('whitelistEnabled:', whitelistEnabled);

  if (DISABLE_ZK_CHECKS) {
    console.log("WARNING: ZK checks disabled.");
  }

  // need to force a compile for tasks
  await hre.run("compile");

  console.log("\n💰 Checking deployer balance...");
  const [deployer] = await hre.ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH`);

  const requires = hre.ethers.parseEther("0.1");
  // Only when deploying to production, give the deployer wallet money,
  // in order for it to be able to deploy the contracts
  if (balance < requires) {
    throw new Error(
      `${deployer.address} requires ~$${hre.ethers.formatEther(
        requires,
      )} but has ${hre.ethers.formatEther(balance)} top up and rerun`,
    );
  }

  console.log("\n📄 Deploying DarkForest contract...");
  // Update addresses in config
  gameConfig.adminAddress = deployer.address;
  gameConfig.whitelistEnabled = whitelistEnabled;

  // Deploy Core contract directly (without needing a separate Whitelist contract)
  console.log("\n📄 Deploying Core contract with integrated whitelist...");
  const coreContractAddress = await deployCore(
    gameConfig,
    hre,
  );
  console.log(`✅ Core deployed to: ${coreContractAddress}`);

  console.log("\n💾 Updating configuration files...");
  try {
    writeEnv(`../whitelist/${isDev ? "dev" : "prod"}.autogen.env`, {
      mnemonic: DEPLOYER_MNEMONIC,
      project_id: PROJECT_ID,
      contract_address: coreContractAddress,
    });
  } catch { }

  fs.writeFileSync(
    isDev === false
      ? "../client/src/utils/prod_contract_addr.ts"
      : "../client/src/utils/local_contract_addr.ts",
    `export const contractAddress = '${coreContractAddress}'`,
  );

  console.log("\n🎉 Deployment complete!");
  console.log("--------------------");
  console.log("Summary:");
  console.log(`Network: ${hre.network.name}`);
  console.log(`Core contract (with integrated whitelist): ${coreContractAddress}`);
  console.log(`Whitelist enabled: ${whitelistEnabled}`);
  console.log(`ZK checks disabled: ${DISABLE_ZK_CHECKS}`);
  console.log("--------------------\n");

  return;
}

task("client:config", "client config").setAction(clientConfig);

async function clientConfig() {
  await exec("mkdir ../client/public/contracts");
  await exec(
    "cp ./artifacts/contracts/DarkForestCore.sol/DarkForestCore.json ../client/public/contracts/DarkForestCore.json",
  );
}

export async function deployCore(
  gameConfig: any,
  hre: HardhatRuntimeEnvironment,
): Promise<string> {
  console.log("\n📦 Deploying library contracts...");

  console.log("1/5 Deploying DarkForestInitialize...");
  const factory1 = await hre.ethers.getContractFactory("DarkForestInitialize");
  const contract1 = await factory1.deploy();
  await contract1.waitForDeployment();
  console.log(`✅ DarkForestInitialize deployed to: ${contract1.target}`);

  console.log("\n2/5 Deploying DarkForestLazyUpdate...");
  const factory2 = await hre.ethers.getContractFactory("DarkForestLazyUpdate");
  const contract2 = await factory2.deploy();
  await contract2.waitForDeployment();
  console.log(`✅ DarkForestLazyUpdate deployed to: ${contract2.target}`);

  console.log("\n3/5 Deploying DarkForestPlanet...");
  const factory3 = await hre.ethers.getContractFactory("DarkForestPlanet");
  const contract3 = await factory3.deploy();
  await contract3.waitForDeployment();
  console.log(`✅ DarkForestPlanet deployed to: ${contract3.target}`);

  console.log("\n4/5 Deploying DarkForestUtils...");
  const factory4 = await hre.ethers.getContractFactory("DarkForestUtils");
  const contract4 = await factory4.deploy();
  await contract4.waitForDeployment();
  console.log(`✅ DarkForestUtils deployed to: ${contract4.target}`);

  console.log("\n5/5 Deploying Verifier...");
  const factory5 = await hre.ethers.getContractFactory("Verifier");
  const contract5 = await factory5.deploy();
  await contract5.waitForDeployment();
  console.log(`✅ Verifier deployed to: ${contract5.target}`);

  console.log("\n🔨 Deploying main DarkForestCore contract...");
  const factory = await hre.ethers.getContractFactory("DarkForestCore", {
    libraries: {
      DarkForestInitialize: contract1.target,
      DarkForestLazyUpdate: contract2.target,
      DarkForestPlanet: contract3.target,
      DarkForestUtils: contract4.target,
      Verifier: contract5.target,
    },
  });
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log("\n🔧 Initializing DarkForestCore...");
  const tx = await contract.initialize(gameConfig);
  console.log("Initialize transaction hash:", tx.hash);
  await tx.wait();
  console.log("✅ Initialization complete");

  console.log(`\n🎯 DarkForestCore deployed to: ${contract.target}`);
  return contract.target.toString();
}
