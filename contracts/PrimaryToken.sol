// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PrimaryToken is ERC20, Ownable {
    uint8 private immutable _decimals;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimalUnits,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        _decimals = _decimalUnits;
        _mint(msg.sender, _initialSupply * (10 ** uint256(_decimalUnits))); // FIXED
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
