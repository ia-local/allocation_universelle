// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CVNU is ERC20, Ownable {
    address public taxCollector;
    uint256 public taxRate; // en basis points (100 = 1%)

    event TaxCollected(address from, uint256 amount);
    event TaxRateUpdated(uint256 oldRate, uint256 newRate);
    event TaxCollectorUpdated(address oldCollector, address newCollector);

    constructor(uint256 initialSupply, address initialTaxCollector, uint256 initialTaxRate)
        ERC20("CVNU Token", "CVNU")
    {
        _mint(msg.sender, initialSupply);
        taxCollector = initialTaxCollector;
        taxRate = initialTaxRate;
    }

    function setTaxCollector(address newCollector) external onlyOwner {
        emit TaxCollectorUpdated(taxCollector, newCollector);
        taxCollector = newCollector;
    }

    function setTaxRate(uint256 newRate) external onlyOwner {
        require(newRate <= 1000, "Max tax rate is 10%");
        emit TaxRateUpdated(taxRate, newRate);
        taxRate = newRate;
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        uint256 taxAmount = (amount * taxRate) / 10000;
        uint256 netAmount = amount - taxAmount;

        if (taxAmount > 0) {
            super.transfer(taxCollector, taxAmount);
            emit TaxCollected(msg.sender, taxAmount);
        }

        return super.transfer(recipient, netAmount);
    }
}
