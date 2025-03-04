const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Whitelisted Vesting Contract - Comprehensive Test", function () {
    let deployer, user1, user2, user3, user4;
    let primaryToken, secondaryToken, whitelistedVesting;

    const TOTAL_PRIMARY_TOKENS = ethers.parseEther("1000000");
    const TOTAL_SECONDARY_TOKENS = ethers.parseEther("1000000");
    const USER_INITIAL_SECONDARY_TOKENS = ethers.parseEther("50000");
    const VESTING_CONTRACT_FUNDING = ethers.parseEther("100000");
    const PURCHASE_AMOUNT = ethers.parseEther("10000");
    const VESTING_DURATION = 30 * 24 * 60 * 60; // 30 days

    before(async function () {
        // Get signers
        [deployer, user1, user2, user3, user4] = await ethers.getSigners();

        // Deploy Primary Token
        const PrimaryToken = await ethers.getContractFactory("PrimaryToken");
        primaryToken = await PrimaryToken.deploy("PrimaryToken", "PTK", 18, TOTAL_PRIMARY_TOKENS);
        await primaryToken.waitForDeployment();

        // Deploy Secondary Token
        const SecondaryToken = await ethers.getContractFactory("SecondaryToken");
        secondaryToken = await SecondaryToken.deploy("SecondaryToken", "STK", primaryToken.target, TOTAL_SECONDARY_TOKENS);
        await secondaryToken.waitForDeployment();

        // Deploy Whitelisted Vesting Contract
        const WhitelistedVesting = await ethers.getContractFactory("WhitelistedVesting");
        whitelistedVesting = await WhitelistedVesting.deploy(primaryToken.target, secondaryToken.target);
        await whitelistedVesting.waitForDeployment();

        // Fund vesting contract with primary tokens
        await primaryToken.transfer(whitelistedVesting.target, VESTING_CONTRACT_FUNDING);

        // Transfer some secondary tokens to users
        await secondaryToken.transfer(user1.address, USER_INITIAL_SECONDARY_TOKENS);
        await secondaryToken.transfer(user2.address, USER_INITIAL_SECONDARY_TOKENS);
        await secondaryToken.transfer(user3.address, USER_INITIAL_SECONDARY_TOKENS);

        // Whitelist user1
        await whitelistedVesting.addToWhitelist(user1.address);

        // Approve and Purchase tokens for user1
        await secondaryToken.connect(user1).approve(whitelistedVesting.target, PURCHASE_AMOUNT);
        await whitelistedVesting.connect(user1).purchaseTokens(PURCHASE_AMOUNT, VESTING_DURATION);
    });

    describe("Token Claiming", function () {
        it("Should allow user to claim vested tokens progressively", async function () {
            // First half of vesting period
            const halfVestingPeriod = VESTING_DURATION / 2;
            await ethers.provider.send("evm_increaseTime", [halfVestingPeriod]);
            await ethers.provider.send("evm_mine");

            // Check initial primary token balance
            const initialBalance = await primaryToken.balanceOf(user1.address);

            // User claims tokens
            await whitelistedVesting.connect(user1).claimTokens();

            // Check balance
            const firstClaimBalance = await primaryToken.balanceOf(user1.address);
            
            console.log("Initial Balance:", ethers.formatEther(initialBalance));
            console.log("First Claim Balance:", ethers.formatEther(firstClaimBalance));

            // Check that some tokens were claimed (approximately half)
            const claimed = firstClaimBalance - initialBalance;
            console.log("Claimed Amount:", ethers.formatEther(claimed));
            
            // Expect claimed amount to be close to half of total allocation
            expect(claimed).to.be.closeTo(PURCHASE_AMOUNT / 2n, PURCHASE_AMOUNT / 10n);
        });

        it("Should allow full claim after vesting period", async function () {
            // Remaining vesting period
            const remainingVestingPeriod = VESTING_DURATION / 2;
            await ethers.provider.send("evm_increaseTime", [remainingVestingPeriod]);
            await ethers.provider.send("evm_mine");
        
            // Check initial primary token balance
            const initialBalance = await primaryToken.balanceOf(user1.address);
        
            // Claim remaining tokens
            await whitelistedVesting.connect(user1).claimTokens();
        
            // Check final balance
            const finalBalance = await primaryToken.balanceOf(user1.address);
            const vestingSchedule = await whitelistedVesting.vestingSchedules(user1.address);
        
            // **FIXED CALCULATION**
            const expectedFinalBalance = vestingSchedule.totalAllocation;
        
            console.log("Initial Balance:", ethers.formatEther(initialBalance));
            console.log("Final Balance:", ethers.formatEther(finalBalance));
            console.log("Total Allocation:", ethers.formatEther(vestingSchedule.totalAllocation));
            console.log("Expected Final Balance:", ethers.formatEther(expectedFinalBalance));
        
            // Allow a small tolerance due to rounding
            const tolerance = ethers.parseEther("0.01");
        
            // Assert that final balance is correct
            expect(finalBalance).to.be.closeTo(expectedFinalBalance, tolerance);
        });
        
        
        it("Should prevent claiming more tokens", async function () {
            // Try to claim again
            await expect(
                whitelistedVesting.connect(user1).claimTokens()
            ).to.be.revertedWith("No tokens to claim");
        });
    });

    describe("Whitelist Management", function () {
        it("Should prevent non-whitelisted users from purchasing", async function () {
            // Attempt to purchase tokens for non-whitelisted user
            await secondaryToken.transfer(user2.address, PURCHASE_AMOUNT);
            await secondaryToken.connect(user2).approve(whitelistedVesting.target, PURCHASE_AMOUNT);
            
            await expect(
                whitelistedVesting.connect(user2).purchaseTokens(PURCHASE_AMOUNT, VESTING_DURATION)
            ).to.be.revertedWith("Not whitelisted");
        });
    });
});
