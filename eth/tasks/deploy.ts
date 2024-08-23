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
  .addOptionalParam("whitelist", "override the whitelist", true, types.boolean)
  .addOptionalParam(
    "fund",
    "amount of eth to fund whitelist contract for fund",
    0.5,
    types.float,
  )
  .setAction(deploy);

async function deploy(
  args: { whitelist: boolean; fund: number; subgraph: string },
  hre: HardhatRuntimeEnvironment,
) {
  const isDev =
    hre.network.name === "hardhat" || hre.network.name === "localhost";

  const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC;

  const PROJECT_ID = process.env.PROJECT_ID;

  const DISABLE_ZK_CHECKS =
    process.env.DISABLE_ZK_CHECKS === undefined
      ? undefined
      : process.env.DISABLE_ZK_CHECKS === "true";

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

  let whitelistEnabled: boolean;
  if (typeof args.whitelist === "undefined") {
    // `whitelistEnabled` defaults to `false` in dev but `true` in prod
    whitelistEnabled = isDev ? false : true;
  } else {
    whitelistEnabled = args.whitelist;
  }

  if (DISABLE_ZK_CHECKS) {
    console.log("WARNING: ZK checks disabled.");
  }

  // need to force a compile for tasks
  await hre.run("compile");

  // Were only using one account, getSigners()[0], the deployer. Becomes the ProxyAdmin
  const [deployer] = await hre.ethers.getSigners();
  // give contract administration over to an admin adress if was provided, or use deployer
  const controllerWalletAddress = deployer.address;

  const requires = hre.ethers.parseEther("0.1");
  // Retrieve the balance of the deployer's address using the provider
  const balance = await deployer.provider.getBalance(deployer.address);

  // Only when deploying to production, give the deployer wallet money,
  // in order for it to be able to deploy the contracts
  if (balance < requires) {
    throw new Error(
      `${deployer.address} requires ~$${hre.ethers.formatEther(
        requires,
      )} but has ${hre.ethers.formatEther(balance)} top up and rerun`,
    );
  }

  // deploy the whitelist contract
  const whitelistContract = await deployWhitelist(
    controllerWalletAddress,
    whitelistEnabled,
    hre,
  );
  try {
    writeEnv(`../whitelist/${isDev ? "dev" : "prod"}.autogen.env`, {
      mnemonic: DEPLOYER_MNEMONIC,
      project_id: PROJECT_ID,
      contract_address: whitelistContract.target.toString(),
    });
  } catch {}

  const coreContractAddress = await deployCore(
    controllerWalletAddress,
    whitelistContract.target.toString(),
    DISABLE_ZK_CHECKS,
    hre,
  );
  fs.writeFileSync(
    isDev === false
      ? "../client/src/utils/prod_contract_addr.ts"
      : "../client/src/utils/local_contract_addr.ts",
    `export const contractAddress = '${coreContractAddress}'`,
  );

  console.log("Deploy over. You can quit this process.");

  return;
}

task("client:config", "client config").setAction(clientConfig);

async function clientConfig() {
  await exec("mkdir ../client/public/contracts");
  await exec(
    "cp ./artifacts/contracts/DarkForestCore.sol/DarkForestCore.json ../client/public/contracts/DarkForestCore.json",
  );
}

export async function deployWhitelist(
  whitelistControllerAddress: string,
  whitelist: boolean,
  hre: HardhatRuntimeEnvironment,
) {
  const factory = await hre.ethers.getContractFactory("Whitelist");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const tx = await contract.initialize(whitelistControllerAddress, whitelist);
  console.log("initialize tx hash: ");
  console.log(tx.hash);
  console.log("Whitelist contract is deployed to ", contract.target);
  return contract;
}

export async function deployCore(
  coreControllerAddress: string,
  whitelistAddress: string,
  DISABLE_ZK_CHECKS: boolean,
  hre: HardhatRuntimeEnvironment,
): Promise<string> {
  const factory1 = await hre.ethers.getContractFactory("DarkForestInitialize");
  const contract1 = await factory1.deploy();
  await contract1.waitForDeployment();

  const factory2 = await hre.ethers.getContractFactory("DarkForestLazyUpdate");
  const contract2 = await factory2.deploy();
  await contract2.waitForDeployment();

  const factory3 = await hre.ethers.getContractFactory("DarkForestPlanet");
  const contract3 = await factory3.deploy();
  await contract3.waitForDeployment();

  const factory4 = await hre.ethers.getContractFactory("DarkForestUtils");
  const contract4 = await factory4.deploy();
  await contract4.waitForDeployment();

  const factory5 = await hre.ethers.getContractFactory("Verifier");
  const contract5 = await factory5.deploy();
  await contract5.waitForDeployment();

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

  const tx = await contract.initialize(
    coreControllerAddress,
    whitelistAddress,
    DISABLE_ZK_CHECKS,
  );
  console.log("initialize tx hash: ");
  console.log(tx.hash);
  console.log(`DFCore deployed to ${contract.target}.`);
  return contract.target.toString();
}
