// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingContract is Ownable {
    IERC20 public primaryToken;
    IERC20 public secondaryToken;

    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
    }

    mapping(address => StakeInfo) public stakes;
    uint256 public rewardRate = 5; // 5% annual reward

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);

    constructor(address _primaryToken, address _secondaryToken) Ownable(msg.sender) {
        primaryToken = IERC20(_primaryToken);
        secondaryToken = IERC20(_secondaryToken);
    }

    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake zero tokens");
        require(primaryToken.transferFrom(msg.sender, address(this), amount), "Stake failed");

        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    function unstake() external {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No staked tokens");

        uint256 reward = calculateReward(msg.sender);
        uint256 amount = userStake.amount;

        userStake.amount = 0;
        userStake.timestamp = 0;

        require(primaryToken.transfer(msg.sender, amount), "Unstake failed");
        if (reward > 0) {
            require(secondaryToken.transfer(msg.sender, reward), "Reward transfer failed");
            emit RewardClaimed(msg.sender, reward);
        }

        emit Unstaked(msg.sender, amount);
    }

    function claimReward() external {
        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards available");

        stakes[msg.sender].timestamp = block.timestamp; // Reset timestamp

        require(secondaryToken.transfer(msg.sender, reward), "Reward transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    function calculateReward(address user) public view returns (uint256) {
        StakeInfo storage userStake = stakes[user];
        if (userStake.amount == 0) return 0;

        uint256 stakedTime = block.timestamp - userStake.timestamp;
        uint256 yearlyReward = (userStake.amount * rewardRate) / 100;
        return (yearlyReward * stakedTime) / (365 days);
    }
}
