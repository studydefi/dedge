const fs = require("fs");
const path = require("path");

const DACProxyFactory = artifacts.require("DACProxyFactory");
const DACManager = artifacts.require("DACManager");
const DedgeMakerManager = artifacts.require("DedgeMakerManager");
const AddressRegistry = artifacts.require("AddressRegistry");
const ActionRegistry = artifacts.require("ActionRegistry");

module.exports = async deployer => {
    await deployer.deploy(DACProxyFactory)
    await deployer.deploy(DACManager)
    await deployer.deploy(DedgeMakerManager)
    await deployer.deploy(AddressRegistry)
    await deployer.deploy(ActionRegistry)

    // Saves to a file if needed
    const data = JSON.stringify({
        dacProxyFactoryAddress: DACProxyFactory.address,
        dacManagerAddress: DACManager.address,
        dedgeMakerManagerAddress: DedgeMakerManager.address,
        addressRegistryAddress: AddressRegistry.address,
        actionRegistryAddress: ActionRegistry.address,
    });

    const buildDir = path.resolve(__dirname, "../build");
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }
    fs.writeFileSync(path.resolve(buildDir, "DeployedAddresses.json"), data);
};
