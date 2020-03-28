const fs = require("fs");
const path = require("path");

const DACProxyFactory = artifacts.require("DACProxyFactory");
const DedgeCompoundManager = artifacts.require("DedgeCompoundManager");
const DedgeMakerManager = artifacts.require("DedgeMakerManager");
const AddressRegistry = artifacts.require("AddressRegistry");

module.exports = async deployer => {
    await deployer.deploy(DACProxyFactory)
    await deployer.deploy(DedgeCompoundManager)
    await deployer.deploy(DedgeMakerManager)
    await deployer.deploy(AddressRegistry)

    // Saves to a file if needed
    const data = JSON.stringify({
        dacProxyFactoryAddress: DACProxyFactory.address,
        dedgeCompoundManagerAddress: DedgeCompoundManager.address,
        dedgeMakerManagerAddress: DedgeMakerManager.address,
        addressRegistryAddress: AddressRegistry.address,
    });

    const buildDir = path.resolve(__dirname, "../build");
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }
    fs.writeFileSync(path.resolve(buildDir, "DeployedAddresses.json"), data);
};
