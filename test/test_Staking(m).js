const { expect } = require("chai");
const { ethers } = require("hardhat");
require("dotenv").config();

describe("StakingContract Full Test", function () {
  let deployer, staker1, staker2;
  let primaryToken, secondaryToken, stakingContract;

  before(async function () {
    [deployer, staker1, staker2] = await ethers.getSigners();

    // Load contract addresses from .env file
    const primaryTokenAddress = process.env.PRIMARY_TOKEN_ADDRESS;
    const secondaryTokenAddress = process.env.SECONDARY_TOKEN_ADDRESS;
    const stakingContractAddress = process.env.STAKING_ADDRESS;

    if (!primaryTokenAddress || !secondaryTokenAddress || !stakingContractAddress) {
      throw new Error("❌ Contract addresses are missing in .env file");
    }

    console.log(`✅ Primary Token: ${primaryTokenAddress}`);
    console.log(`✅ Secondary Token: ${secondaryTokenAddress}`);
    console.log(`✅ Staking Contract: ${stakingContractAddress}`);

    // Attach contracts
    primaryToken = await ethers.getContractAt("IERC20", primaryTokenAddress);
    secondaryToken = await ethers.getContractAt("IERC20", secondaryTokenAddress);
    stakingContract = await ethers.getContractAt("StakingContract", stakingContractAddress);

    // Fund stakers with primary tokens
    const transferAmount = ethers.parseUnits("10000", 18);
    await primaryToken.connect(deployer).transfer(staker1.address, transferAmount);
    await primaryToken.connect(deployer).transfer(staker2.address, transferAmount);

    // Fund staking contract with secondary tokens for rewards
    const rewardAmount = ethers.parseUnits("1000", 18);
    await secondaryToken.connect(deployer).transfer(stakingContractAddress, rewardAmount);
  });

  it("Should allow staking tokens", async function () {
    const stakeAmount = ethers.parseUnits("100", 18);

    // Approve and stake
    await primaryToken.connect(staker1).approve(stakingContract.target, stakeAmount);
    await expect(stakingContract.connect(staker1).stake(stakeAmount))
      .to.emit(stakingContract, "Staked")
      .withArgs(staker1.address, stakeAmount);

    // Check staked balance
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
    const stakeAmount = ethers.parseUnits("200", 18);
    await primaryToken.connect(staker1).approve(stakingContract.target, stakeAmount);
    await stakingContract.connect(staker1).stake(stakeAmount);

    // Increase time by 1 year (365 days)
    await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");

    const expectedReward = (stakeAmount * BigInt(5)) / BigInt(100); // 5% reward

    // Claim rewards
    await expect(stakingContract.connect(staker1).claimReward())
      .to.emit(stakingContract, "RewardClaimed")
      .withArgs(staker1.address, expectedReward);

    // Verify balance
    const rewardBalance = await secondaryToken.balanceOf(staker1.address);
    expect(rewardBalance).to.equal(expectedReward);
  });

  it("Should prevent claiming rewards when none are available", async function () {
    await expect(stakingContract.connect(staker2).claimReward())
      .to.be.revertedWith("No rewards available");
  });

  it("Should handle multiple stakers correctly", async function () {
    const stakeAmount1 = ethers.parseUnits("100", 18);
    const stakeAmount2 = ethers.parseUnits("200", 18);

    await primaryToken.connect(staker1).approve(stakingContract.target, stakeAmount1);
    await primaryToken.connect(staker2).approve(stakingContract.target, stakeAmount2);

    await stakingContract.connect(staker1).stake(stakeAmount1);
    await stakingContract.connect(staker2).stake(stakeAmount2);

    // Ensure both have correct balances
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
