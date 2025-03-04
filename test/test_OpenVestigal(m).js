const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OpenVesting Contract - Local Deployment Test", function () {
    let deployer, user1, user2;
    let primaryToken, secondaryToken, openVesting;

    before(async function () {
        // Get signers
        [deployer, user1, user2] = await ethers.getSigners();

        // Deploy Primary Token
        const PrimaryToken = await ethers.getContractFactory("PrimaryToken");
        primaryToken = await PrimaryToken.deploy(
            "PrimaryToken", 
            "PTK", 
            18,  // decimals
            ethers.parseEther("1000000")
        );
        await primaryToken.waitForDeployment();

        // Deploy Secondary Token 
        const SecondaryToken = await ethers.getContractFactory("SecondaryToken");
        secondaryToken = await SecondaryToken.deploy(
            "SecondaryToken", 
            "STK", 
            primaryToken.target,  // primary token address 
            ethers.parseEther("1000000")
        );
        await secondaryToken.waitForDeployment();

        // Deploy OpenVesting
        const OpenVesting = await ethers.getContractFactory("OpenVesting");
        openVesting = await OpenVesting.deploy(
            primaryToken.target,   // Primary token address
            secondaryToken.target  // Secondary token address
        );
        await openVesting.waitForDeployment();

        // Transfer tokens to vesting contract
        await primaryToken.transfer(openVesting.target, ethers.parseEther("100000"));

        // Transfer some secondary tokens to user1 for purchasing
        await secondaryToken.transfer(user1.address, ethers.parseEther("50000"));
    });

    it("Should allow user to purchase tokens with secondary tokens", async function () {
        // Purchase parameters
        const purchaseAmount = ethers.parseEther("30000");
        const vestingDuration = 30 * 24 * 60 * 60; // 30 days

        // Approve secondary tokens for purchase
        const approveTx = await secondaryToken.connect(user1).approve(
            openVesting.target, 
            purchaseAmount
        );
        await approveTx.wait();

        // Perform token purchase
        const purchaseTx = await openVesting.connect(user1).purchaseTokens(
            purchaseAmount, 
            vestingDuration
        );
        await purchaseTx.wait();

        // Verify vesting schedule
        const vestingSchedule = await openVesting.vestingSchedules(user1.address);
        
        console.log("Vesting Schedule:", {
            amount: ethers.formatEther(vestingSchedule.totalAllocation),
            startTime: vestingSchedule.startTime.toString(),
            duration: vestingSchedule.duration.toString(),
            released: ethers.formatEther(vestingSchedule.released)
        });

        expect(vestingSchedule.totalAllocation).to.equal(purchaseAmount);
        expect(vestingSchedule.duration).to.equal(vestingDuration);
    });

    // it("Should prevent multiple vesting schedules for same user", async function () {
    //     const purchaseAmount = ethers.parseEther("30000");
    //     const vestingDuration = 30 * 24 * 60 * 60;

    //     // First approve tokens again
    //     const approveTx = await secondaryToken.connect(user1).approve(
    //         openVesting.target, 
    //         purchaseAmount
    //     );
    //     await approveTx.wait();

    //     // Use try-catch to handle potential different error formats
    //     try {
    //         await openVesting.connect(user1).purchaseTokens(
    //             purchaseAmount, 
    //             vestingDuration
    //         );
    //         expect.fail("Transaction should have been reverted");
    //     } catch (error) {
    //         expect(error.message).to.include("Vesting schedule already exists");
    //     }
    // });

    it("Should allow partial token claims during vesting period", async function () {
        // Fast forward time by 15 days (half the vesting period)
        const halfVestingPeriod = 15 * 24 * 60 * 60;
        await ethers.provider.send("evm_increaseTime", [halfVestingPeriod]);
        await ethers.provider.send("evm_mine");

        // Claim tokens
        const claimTx = await openVesting.connect(user1).claimTokens();
        await claimTx.wait();

        // Check user's primary token balance
        const userBalance = await primaryToken.balanceOf(user1.address);
        
        console.log("User Token Balance After 15 Days:", ethers.formatEther(userBalance));

        // Verify balance is approximately half of total vesting amount
        const vestingSchedule = await openVesting.vestingSchedules(user1.address);
        const expectedClaim = vestingSchedule.totalAllocation * BigInt(halfVestingPeriod) / vestingSchedule.duration;

        console.log("Expected Claim Amount:", ethers.formatEther(expectedClaim));

        expect(userBalance).to.be.closeTo(expectedClaim, expectedClaim / BigInt(10));
    });

    it("Should allow full token claim after vesting period", async function () {
        // Fast forward time to complete vesting period
        const remainingVestingPeriod = 15 * 24 * 60 * 60;
        await ethers.provider.send("evm_increaseTime", [remainingVestingPeriod]);
        await ethers.provider.send("evm_mine");

        // Claim remaining tokens
        const claimTx = await openVesting.connect(user1).claimTokens();
        await claimTx.wait();

        // Check user's primary token balance
        const userBalance = await primaryToken.balanceOf(user1.address);
        
        // Get original vesting amount
        const vestingSchedule = await openVesting.vestingSchedules(user1.address);
        
        console.log("User Final Token Balance:", ethers.formatEther(userBalance));
        console.log("Original Vesting Amount:", ethers.formatEther(vestingSchedule.totalAllocation));

        // Verify full amount is claimed
        expect(userBalance).to.equal(vestingSchedule.totalAllocation);
    });

    // it("Should prevent double-claiming of tokens", async function () {
    //     // Use try-catch to handle potential different error formats
    //     try {
    //         await openVesting.connect(user1).claimTokens();
    //         expect.fail("Transaction should have been reverted");
    //     } catch (error) {
    //         expect(error.message).to.include("No tokens to claim");
    //     }
    // });
});