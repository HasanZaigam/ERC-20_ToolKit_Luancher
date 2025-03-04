const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20 Launcher Kit - Purchase & Claim Test", function () {
    let deployer, user1, user2;
    let primaryToken, openVesting;

    before(async function () {
        [deployer, user1, user2] = await ethers.getSigners();

        // Deploy Primary Token
        const PrimaryToken = await ethers.getContractFactory("PrimaryToken");
        primaryToken = await PrimaryToken.deploy("PrimaryToken", "PTK", ethers.parseEther("1000000"));
        await primaryToken.waitForDeployment();

        // Deploy OpenVesting
        const OpenVesting = await ethers.getContractFactory("OpenVesting");
        openVesting = await OpenVesting.deploy(primaryToken.target);
        await openVesting.waitForDeployment();

        // Transfer tokens to vesting contract
        await primaryToken.transfer(openVesting.target, ethers.parseEther("100000"));
    });

    it("Should allow user to purchase 30,000 tokens and claim after 12 hours", async function () {
        // Important: In the contract, tokens are represented in wei (18 decimals)
        // So we need to use the correct units for both tokens and ETH
        
        // We want to purchase 30,000 tokens with 18 decimals
        const purchaseAmount = ethers.parseEther("30000"); // 30,000 tokens with 18 decimals
        
        // The contract requires 0.01 ETH per token
        // For 30,000 tokens, we need 30,000 * 0.01 = 300 ETH
        const requiredPayment = ethers.parseEther("300");
        
        console.log("Tokens to purchase:", ethers.formatEther(purchaseAmount));
        console.log("ETH required for purchase:", ethers.formatEther(requiredPayment));
        
        // Get user ETH balance before purchase
        const userBalanceBefore = await ethers.provider.getBalance(user2.address);
        console.log("User2 ETH Balance Before Purchase:", ethers.formatEther(userBalanceBefore));

        // Check if user has enough ETH
        expect(userBalanceBefore).to.be.gte(requiredPayment, "User doesn't have enough ETH");

        // Debug: Let's look at the contract's code for purchaseTokens
        console.log("Contract requires: msg.value >= amount * 0.01 ether");
        console.log("We're sending:", ethers.formatEther(requiredPayment), "ETH for", 
                   ethers.formatEther(purchaseAmount), "tokens");

        // Perform token purchase
        const tx = await openVesting.connect(user2).purchaseTokens(purchaseAmount, { 
            value: requiredPayment
        });
        
        // Wait for transaction to be mined
        await tx.wait();

        // Check user allocation
        const allocation = await openVesting.allocations(user2.address);
        console.log("User2 allocation after purchase:", ethers.formatEther(allocation), "tokens");
        expect(allocation).to.equal(purchaseAmount);

        // 🕒 Advance time by 12 hours
        await ethers.provider.send("evm_increaseTime", [12 * 60 * 60]); // 12 hours
        await ethers.provider.send("evm_mine");

        // Calculate expected claim amount (12 hours out of 30 days = 1/60 of total)
        const expectedClaimPercentage = BigInt(12 * 60 * 60) * BigInt(100) / BigInt(30 * 24 * 60 * 60);
        console.log("Percentage vested after 12 hours:", Number(expectedClaimPercentage), "%");
        
        const expectedClaim = purchaseAmount * BigInt(12 * 60 * 60) / BigInt(30 * 24 * 60 * 60);
        console.log("Expected claim after 12 hours:", ethers.formatEther(expectedClaim), "tokens");

        // Claim tokens
        const claimTx = await openVesting.connect(user2).claimTokens();
        await claimTx.wait();

        // Verify user token balance
        const finalBalance = await primaryToken.balanceOf(user2.address);
        console.log("User2 Token Balance After Claim:", ethers.formatEther(finalBalance), "tokens");
        expect(finalBalance).to.be.equal(expectedClaim);
    });
});