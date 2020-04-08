const fs = require("fs");
const path = require("path");

const DACProxyFactory = artifacts.require("DACProxyFactory");
const DedgeGeneralManager = artifacts.require("DedgeGeneralManager");
const DedgeExitManager = artifacts.require("DedgeExitManager");
const DedgeCompoundManager = artifacts.require("DedgeCompoundManager");
const DedgeMakerManager = artifacts.require("DedgeMakerManager");
const AddressRegistry = artifacts.require("AddressRegistry");

module.exports = async deployer => {
    await deployer.deploy(DACProxyFactory, { overwrite: false })
    await deployer.deploy(DedgeCompoundManager, { overwrite: true })
    await deployer.deploy(DedgeGeneralManager, { overwrite: false })
    await deployer.deploy(DedgeExitManager, { overwrite: false })
    await deployer.deploy(DedgeMakerManager, { overwrite: false })
    await deployer.deploy(AddressRegistry, { overwrite: false })

    // Saves to a file if needed
    const data = JSON.stringify({
        dacProxyFactoryAddress: DACProxyFactory.address,
        dedgeCompoundManagerAddress: DedgeCompoundManager.address,
        dedgeMakerManagerAddress: DedgeMakerManager.address,
        dedgeExitManagerAddress: DedgeExitManager.address,
        dedgeGeneralManagerAddress: DedgeGeneralManager.address,
        addressRegistryAddress: AddressRegistry.address,
    });

    const buildDir = path.resolve(__dirname, "../build");
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }
    fs.writeFileSync(path.resolve(buildDir, "DeployedAddresses.json"), data);
};
