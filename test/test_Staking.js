const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingContract Full Test", function () {
    let deployer, staker1, staker2;
    let primaryToken, secondaryToken, stakingContract;

    before(async function () {
        [deployer, staker1, staker2] = await ethers.getSigners();

        // Deploy Primary Token
        const PrimaryToken = await ethers.getContractFactory("PrimaryToken");
        primaryToken = await PrimaryToken.deploy("PrimaryToken", "PTK", ethers.parseEther("1000000"));
        await primaryToken.waitForDeployment();

        // Deploy Secondary Token
        const SecondaryToken = await ethers.getContractFactory("SecondaryToken");
        secondaryToken = await SecondaryToken.deploy("SecondaryToken", "STK", primaryToken.target, ethers.parseEther("1000000"));
        await secondaryToken.waitForDeployment();

        // ✅ Deploy the Staking Contract with correct constructor arguments
        const StakingContract = await ethers.getContractFactory("StakingContract");
        stakingContract = await StakingContract.deploy(primaryToken.target, secondaryToken.target);
        await stakingContract.waitForDeployment();

        console.log(`✅ Staking Contract Deployed at: ${stakingContract.target}`);

        // Transfer tokens to users
        const initialStakeAmount = ethers.parseEther("10000");
        await primaryToken.transfer(staker1.address, initialStakeAmount);
        await primaryToken.transfer(staker2.address, initialStakeAmount);

        // Fund staking contract with rewards
        const rewardPoolAmount = ethers.parseEther("1000");
        await secondaryToken.transfer(stakingContract.target, rewardPoolAmount);
    });

    it("Should allow staking tokens", async function () {
        const stakeAmount = ethers.parseEther("100");

        await primaryToken.connect(staker1).approve(stakingContract.target, stakeAmount);

        await expect(stakingContract.connect(staker1).stake(stakeAmount))
            .to.emit(stakingContract, "Staked")
            .withArgs(staker1.address, stakeAmount);

        const stakeInfo = await stakingContract.stakes(staker1.address);
        expect(stakeInfo.amount).to.equal(stakeAmount);
    });

    it("Should prevent staking zero tokens", async function () {
        await expect(stakingContract.connect(staker1).stake(0))
            .to.be.revertedWith("Cannot stake zero tokens");
    });

    it("Should prevent unstaking when no tokens are staked", async function () {
        await expect(stakingContract.connect(staker2).unstake())
            .to.be.revertedWith("No staked tokens");
    });

    it("Should allow withdrawing staked tokens", async function () {
        const initialBalance = await primaryToken.balanceOf(staker1.address);
        await stakingContract.connect(staker1).unstake();

        const finalBalance = await primaryToken.balanceOf(staker1.address);
        expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should calculate rewards correctly over time", async function () {
        const stakeAmount = ethers.parseEther("200");
        await primaryToken.connect(staker1).approve(stakingContract.target, stakeAmount);
        await stakingContract.connect(staker1).stake(stakeAmount);

        // Fast forward 1 year
        await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
        await ethers.provider.send("evm_mine");

        const expectedReward = stakeAmount * BigInt(5) / BigInt(100); // Assuming 5% APY

        await expect(stakingContract.connect(staker1).claimReward())
            .to.emit(stakingContract, "RewardClaimed")
            .withArgs(staker1.address, expectedReward);

        const rewardBalance = await secondaryToken.balanceOf(staker1.address);
        expect(rewardBalance).to.be.closeTo(expectedReward, ethers.parseEther("0.01"));
    });

    it("Should prevent claiming rewards when none are available", async function () {
        await expect(stakingContract.connect(staker2).claimReward())
            .to.be.revertedWith("No rewards available");
    });

    it("Should handle multiple stakers correctly", async function () {
        const stakeAmount1 = ethers.parseEther("100");
        const stakeAmount2 = ethers.parseEther("200");

        await primaryToken.connect(staker1).approve(stakingContract.target, stakeAmount1);
        await primaryToken.connect(staker2).approve(stakingContract.target, stakeAmount2);

        await stakingContract.connect(staker1).stake(stakeAmount1);
        await stakingContract.connect(staker2).stake(stakeAmount2);

        const stakeInfo1 = await stakingContract.stakes(staker1.address);
        const stakeInfo2 = await stakingContract.stakes(staker2.address);

        expect(stakeInfo1.amount).to.equal(stakeAmount1);
        expect(stakeInfo2.amount).to.equal(stakeAmount2);
    });

    it("Should revert when trying to unstake twice", async function () {
        await stakingContract.connect(staker1).unstake();
        await expect(stakingContract.connect(staker1).unstake())
            .to.be.revertedWith("No staked tokens");
    });
});
