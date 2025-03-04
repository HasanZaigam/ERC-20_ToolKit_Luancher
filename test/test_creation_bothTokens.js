const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Creation Test", function () {
    let deployer, primaryToken, secondaryToken;

    before(async function () {
        [deployer] = await ethers.getSigners();

        // Deploy Primary Token
        const PrimaryToken = await ethers.getContractFactory("PrimaryToken");
        primaryToken = await PrimaryToken.deploy("PrimaryToken", "PTK", ethers.parseEther("1000000"));
        await primaryToken.waitForDeployment();

        // Deploy Secondary Token
        const SecondaryToken = await ethers.getContractFactory("SecondaryToken");
        secondaryToken = await SecondaryToken.deploy("SecondaryToken", "STK", primaryToken.target);
        await secondaryToken.waitForDeployment();
    });

    it("Should verify Primary Token details", async function () {
        const name = await primaryToken.name();
        const symbol = await primaryToken.symbol();
        const totalSupply = await primaryToken.totalSupply();

        console.log("Primary Token Name:", name);
        console.log("Primary Token Symbol:", symbol);
        console.log("Primary Token Total Supply:", ethers.formatEther(totalSupply));

        // ✅ Correct assertion
        expect(name).to.equal("PrimaryToken");
        expect(symbol).to.equal("PTK");
        expect(totalSupply.toString()).to.equal(ethers.parseEther("1000000").toString());
    });

    it("Should verify Secondary Token details", async function () {
        const name = await secondaryToken.name();
        const symbol = await secondaryToken.symbol();

        console.log("Secondary Token Name:", name);
        console.log("Secondary Token Symbol:", symbol);

        expect(name).to.equal("SecondaryToken");
        expect(symbol).to.equal("STK");
    });
});
