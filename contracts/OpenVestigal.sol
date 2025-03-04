// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OpenVesting is Ownable {
    IERC20 public primaryToken;
    IERC20 public secondaryToken;

    struct VestingSchedule {
        uint256 totalAllocation;
        uint256 released;
        uint256 startTime;
        uint256 duration;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    uint256 public totalFundsAllocated;
    uint256 public totalFundsSold;
    
    event TokensPurchased(address indexed buyer, uint256 amount);
    event TokensClaimed(address indexed user, uint256 amount);
    
    constructor(address _primaryToken, address _secondaryToken) Ownable(msg.sender) {
        require(_primaryToken != address(0) && _secondaryToken != address(0), "Invalid token addresses");
        primaryToken = IERC20(_primaryToken);
        secondaryToken = IERC20(_secondaryToken);
    }
    
    function purchaseTokens(uint256 _amount, uint256 _vestingDuration) external {
        require(_amount > 0, "Amount must be greater than 0");
        require(_vestingDuration > 0, "Vesting duration must be valid");
        
        require(secondaryToken.transferFrom(msg.sender, address(this), _amount), "Payment failed");
        
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAllocation == 0, "Vesting schedule already exists");
        
        vestingSchedules[msg.sender] = VestingSchedule({
            totalAllocation: _amount,
            released: 0,
            startTime: block.timestamp,
            duration: _vestingDuration
        });
        
        totalFundsAllocated += _amount;
        totalFundsSold += _amount;
        
        emit TokensPurchased(msg.sender, _amount);
    }
    
    function claimTokens() external {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAllocation > 0, "No tokens to claim");
        require(block.timestamp >= schedule.startTime, "Vesting not started");
        
        uint256 elapsedTime = block.timestamp - schedule.startTime;
        uint256 vestedAmount = (schedule.totalAllocation * elapsedTime) / schedule.duration;
        vestedAmount = vestedAmount > schedule.totalAllocation ? schedule.totalAllocation : vestedAmount;
        uint256 claimable = vestedAmount - schedule.released;
        
        require(claimable > 0, "No tokens available for claim");
        
        schedule.released += claimable;
        require(primaryToken.transfer(msg.sender, claimable), "Token transfer failed");
        
        emit TokensClaimed(msg.sender, claimable);
    }
    
    function withdrawFunds(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Amount must be greater than 0");
        require(secondaryToken.balanceOf(address(this)) >= _amount, "Insufficient balance");
        
        require(secondaryToken.transfer(_to, _amount), "Withdrawal failed");
    }
}
