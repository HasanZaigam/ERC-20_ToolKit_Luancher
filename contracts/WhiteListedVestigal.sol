// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WhitelistedVesting is Ownable {
    struct VestingSchedule {
        uint256 totalAllocation;
        uint256 startTime;
        uint256 duration;
        uint256 claimedAmount;
        bool exists;
    }

    IERC20 public primaryToken;
    IERC20 public secondaryToken;
    
    mapping(address => VestingSchedule) public vestingSchedules;
    mapping(address => bool) public whitelist;

    event WhitelistAdded(address indexed user);
    event WhitelistRemoved(address indexed user);
    event TokensPurchased(address indexed user, uint256 amount, uint256 duration);
    event TokensClaimed(address indexed user, uint256 amount);

    constructor(address _primaryToken, address _secondaryToken) Ownable(msg.sender) {
        primaryToken = IERC20(_primaryToken);
        secondaryToken = IERC20(_secondaryToken);
    }

    function addToWhitelist(address user) external onlyOwner {
        whitelist[user] = true;
        emit WhitelistAdded(user);
    }

    function removeFromWhitelist(address user) external onlyOwner {
        whitelist[user] = false;
        emit WhitelistRemoved(user);
    }

    function purchaseTokens(uint256 amount, uint256 duration) external {
        require(whitelist[msg.sender], "Not whitelisted");
        require(duration > 0, "Invalid duration");
        require(amount > 0, "Invalid amount");

        // Transfer secondary tokens from user
        require(secondaryToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Create or update vesting schedule
        vestingSchedules[msg.sender] = VestingSchedule({
            totalAllocation: amount,
            startTime: block.timestamp,
            duration: duration,
            claimedAmount: 0,
            exists: true
        });

        emit TokensPurchased(msg.sender, amount, duration);
    }

    function calculateClaimableAmount(VestingSchedule memory schedule) public view returns (uint256) {
        uint256 currentTime = block.timestamp;
        uint256 vestingEnd = schedule.startTime + schedule.duration;
        
        // If vesting period hasn't started
        if (currentTime < schedule.startTime) {
            return 0;
        }
        
        // If vesting period is complete
        if (currentTime >= vestingEnd) {
            return schedule.totalAllocation;
        }
        
        // Calculate proportional amount during vesting
        uint256 elapsedTime = currentTime - schedule.startTime;
        return (schedule.totalAllocation * elapsedTime) / schedule.duration;
    }

    function claimTokens() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.exists, "No vesting schedule");
        
        // Calculate claimable amount
        uint256 claimableAmount = calculateClaimableAmount(schedule);
        uint256 remainingToClaim = claimableAmount - schedule.claimedAmount;
        
        require(remainingToClaim > 0, "No tokens to claim");
        
        // Update claimed amount
        schedule.claimedAmount += remainingToClaim;
        
        // Transfer primary tokens
        require(primaryToken.transfer(msg.sender, remainingToClaim), "Transfer failed");
        
        emit TokensClaimed(msg.sender, remainingToClaim);
    }

    // Allows owner to retrieve any unsold tokens
    function retrieveUnsoldTokens() external onlyOwner {
        uint256 balance = primaryToken.balanceOf(address(this));
        primaryToken.transfer(owner(), balance);
    }
}