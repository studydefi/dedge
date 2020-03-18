const fs = require("fs");
const path = require("path");

// const Dedge = artifacts.require("Dedge");
const DedgeProxyFactory = artifacts.require("DedgeProxyFactory");
const DedgeCompoundManager = artifacts.require("DedgeCompoundManager");
const DedgeMakerManager = artifacts.require("DedgeMakerManager");

module.exports = async deployer => {
    // Deploys DedgeProxyFactory
    await deployer.deploy(DedgeProxyFactory)

    // Deploys Dedge Contract
    await deployer.deploy(DedgeMakerManager);

    // Deploys DedgeCompoundManager
    await deployer.deploy(DedgeCompoundManager)

    // Saves to a file if needed
    const data = JSON.stringify({
        dedgeProxyFactoryAddress: DedgeProxyFactory.address,
        dedgeMakerManagerAddress: DedgeMakerManager.address,
        dedgeCompoundManagerAddress: DedgeCompoundManager.address
    });

    const buildDir = path.resolve(__dirname, "../build");
    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir);
    }
    fs.writeFileSync(path.resolve(buildDir, "DeployedAddresses.json"), data);
};
