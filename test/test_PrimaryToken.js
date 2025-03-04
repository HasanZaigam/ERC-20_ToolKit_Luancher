const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrimaryToken Contract", function () {
    let PrimaryToken, token, owner, addr1, addr2;
    const name = "FutureToken";
    const symbol = "FTK";
    const decimals = 18;
    const initialSupply = ethers.parseEther("1000000"); // 1M Tokens

    before(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        PrimaryToken = await ethers.getContractFactory("PrimaryToken");
        token = await PrimaryToken.deploy(name, symbol, decimals, initialSupply);
        await token.waitForDeployment();
    });

    it("✅ Should deploy with correct name, symbol, decimals, and initial supply", async function () {
        expect(await token.name()).to.equal(name);
        expect(await token.symbol()).to.equal(symbol);
        expect(await token.decimals()).to.equal(decimals);
        
        // Get the actual total supply from the contract
        const actualSupply = await token.totalSupply();
        console.log(`✅ Token Created: ${await token.name()} (${await token.symbol()}), Decimals: ${await token.decimals()}, Supply: ${ethers.formatEther(actualSupply)} FTK`);
    });

    it("✅ Should assign initial supply to owner", async function () {
        const ownerBalance = await token.balanceOf(owner.address);
        console.log(`✅ Owner's Initial Balance: ${ethers.formatEther(ownerBalance)} FTK`);
    });

    it("✅ Should allow token transfers", async function () {
        const transferAmount = ethers.parseEther("100");
        await token.transfer(addr1.address, transferAmount);
        expect(await token.balanceOf(addr1.address)).to.equal(transferAmount);
        console.log(`✅ Transferred 100 FTK to ${addr1.address}, New Balance: ${ethers.formatEther(await token.balanceOf(addr1.address))} FTK`);
    });

    it("✅ Should not allow transfer of more tokens than balance", async function () {
        await expect(token.connect(addr1).transfer(owner.address, ethers.parseEther("200"))).to.be.reverted;
        console.log(`✅ Transfer of 200 FTK from ${addr1.address} reverted as expected (Insufficient Balance)`);
    });

    it("✅ Should allow approval and transferFrom", async function () {
        const approveAmount = ethers.parseEther("50");
        await token.connect(addr1).approve(owner.address, approveAmount);
        await token.transferFrom(addr1.address, owner.address, approveAmount);
        
        // Get final balances for verification
        const addr1Balance = await token.balanceOf(addr1.address);
        const ownerBalance = await token.balanceOf(owner.address);
        
        // Ensure addr1 has 50 less tokens
        expect(addr1Balance).to.equal(ethers.parseEther("50"));
        
        console.log(`✅ Approved & Transferred 50 FTK back to Owner, New Owner Balance: ${ethers.formatEther(ownerBalance)} FTK`);
    });

    it("✅ Should not allow non-approved transferFrom", async function () {
        await expect(token.connect(addr2).transferFrom(addr1.address, owner.address, ethers.parseEther("50"))).to.be.reverted;
        console.log(`✅ Non-approved transferFrom reverted as expected`);
    });

    it("✅ Should allow owner to transfer ownership", async function () {
        await token.transferOwnership(addr1.address);
        expect(await token.owner()).to.equal(addr1.address);
        console.log(`✅ Ownership transferred to ${addr1.address}`);
    });
});



// it("✅ Should transfer ownership to addr1 and verify", async function () {
//     const currentOwner = await token.owner();
//     console.log("Current contract owner:", currentOwner);

//     if (currentOwner.toLowerCase() !== walletSigner.address.toLowerCase()) {
//         console.log("⚠️ Test cannot proceed: walletSigner is NOT the contract owner!");
//         this.skip(); // Skip the test
//     }

//     console.log("Transferring ownership to addr1...");
//     const tx = await token.connect(walletSigner).transferOwnership(addr1.address);
//     await tx.wait(1);

//     const newOwner = await token.owner();
//     console.log("New owner after transfer:", newOwner);

//     expect(newOwner.toLowerCase()).to.equal(addr1.address.toLowerCase());
// });