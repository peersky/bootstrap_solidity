import { HardhatRuntimeEnvironment } from "hardhat/types";
export const deploy = async ({
  ContractName,
  constructorArgs,
  hre,
}: {
  ContractName: string;
  constructorArgs?: any;
  hre: HardhatRuntimeEnvironment;
}) => {
  const Contract = await hre.ethers.getContractFactory(ContractName);
  console.log(
    "deploying with args",
    ...constructorArgs.slice(1, constructorArgs.length)
  );

  const contract = await Contract.deploy(
    ...constructorArgs.slice(1, constructorArgs.length)
  );
  await contract.deployed();
  if (require.main === module) {
    console.log(
      "Deploy ",
      ContractName,
      " hash:",
      contract.deployTransaction.hash
    );
  }
  return contract.address;
};

if (require.main === module) {
  // TODO: Take arg values
}

exports.deploy = deploy;
export default { deploy };
