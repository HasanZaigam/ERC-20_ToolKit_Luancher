// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IPrimaryToken {
    function decimals() external view returns (uint8);
}

contract SecondaryToken is ERC20, Ownable {
    IPrimaryToken public primaryToken;
    uint8 private immutable _decimals;

    constructor(
        string memory _name,
        string memory _symbol,
        address _primaryTokenAddress,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_primaryTokenAddress != address(0), "Invalid primary token address");
        primaryToken = IPrimaryToken(_primaryTokenAddress);
        _decimals = primaryToken.decimals();
        _mint(msg.sender, _initialSupply * (10 ** uint256(_decimals)));
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function updatePrimaryToken(address _newPrimaryToken) external onlyOwner {
        require(_newPrimaryToken != address(0), "Invalid primary token address");
        primaryToken = IPrimaryToken(_newPrimaryToken);
    }
}
