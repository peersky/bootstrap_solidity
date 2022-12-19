import { task } from "hardhat/config";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-truffle5";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-ethers";
import "hardhat-diamond-abi";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import { toSignature, isIncluded } from "./utils/diamond";
import { cutFacets, replaceFacet } from "./scripts/libraries/diamond";
import * as ipfsUtils from "./utils/ipfs";
import fs from "fs";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("deployContract", "Deploys contract")
  .addParam("contractName", "contract name")
  .addOptionalVariadicPositionalParam(
    "constructorArgs",
    "Constructor arguments"
  )
  .setAction(async (taskArgs, hre) => {
    const address = await deploy({
      hre,
      ContractName: taskArgs.contractName,
      constructorArgs: taskArgs.constructorArgs,
    });
    console.log("Deployed ", taskArgs.contractName, "at: ", address);
  });

task("upload2IPFS", "Uploads files to ipfs")
  .addParam("path", "file path")
  .setAction(async (taskArgs) => {
    const data = fs.readFileSync(taskArgs.path);
    await ipfsUtils.upload2IPFS(data);
  });

task("uploadDir2IPFS", "Uploads directory to ipfs")
  .addParam("path", "path")
  .setAction(async (taskArgs) => {
    await ipfsUtils.uploadDir2IPFS(taskArgs.path);
  });

task("replaceFacet", "Upgrades facet")
  .addParam("facet", "facet")
  .addParam("address", "contract address")
  .setAction(async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();
    const response = await replaceFacet(
      taskArgs.address,
      taskArgs.facet,
      accounts[0]
    );
  });

task("addFacet", "adds a facet")
  .addParam("facet", "facet")
  .addParam("address", "contract address")
  .setAction(async (taskArgs, hre) => {
    const Facet = await hre.ethers.getContractFactory(taskArgs.facet);
    const accounts = await hre.ethers.getSigners();
    const facet = await Facet.deploy();
    await facet.deployed();

    const response = await cutFacets({
      facets: [facet],
      diamondAddress: taskArgs.address,
      signer: accounts[0],
    });

    console.log(response.hash);
  });

export default {
  gasReporter: {
    currency: "EUR",
    gasPrice: 21,
    enabled: false,
    coinmarketcap: process.env.COINMARKETCAP_KEY,
  },
  defaultNetwork: "hardhat",
  networks: {
    mumbai: {
      url: "https://matic-mumbai.chainstacklabs.com",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    },
    matic: {
      url: process.env.RPC_URL ?? "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    },
    ganache: {
      url: process.env.GANACHE_RPC_URL ?? "",
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    },
    gorli: {
      url: process.env.GORLI_RPC_URL ?? "",
      accounts: [
        accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      ],
    },
  },
  paths: {
    sources: "./contracts",
  },
  solidity: {
    compilers: [
      {
        version: "0.8.8",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
      {
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 2000,
          },
        },
      },
    ],
  },
  diamondAbi: [],
  typechain: {
    outDir: "types/typechain",
    target: "ethers-v5",
    alwaysGenerateOverloads: true, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    // externalArtifacts: ["externalArtifacts/*.json"], // optional array of glob patterns with external artifacts to process (for example external libs from node_modules)
  },

  abiExporter: {
    path: "./abi",
    runOnCompile: true,
    clear: true,
    format: "fullName",
    spacing: 2,
    pretty: false,
  },
};
