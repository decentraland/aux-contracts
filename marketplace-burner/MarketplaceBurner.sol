pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

interface BurnableERC20 {
    function burn(uint256 amount) public;
}

interface Marketplace {
    function setOwnerCutPerMillion(uint256 _ownerCutPerMillion) external;
    function pause() public;
}

contract MarketplaceBurner is Ownable {

    Marketplace public marketplace;
    BurnableERC20 public mana;

    constructor(address manaAddress, address marketAddress) public {
        mana = BurnableERC20(manaAddress);
        marketplace = Marketplace(marketAddress);
    }

    function burn() public {
        mana.burn(mana.balanceOf(this));
    }

    function setOwnerCutPerMillion(uint256 _ownerCutPerMillion) public onlyOwner {
        marketplace.setOwnerCutPerMillion(_ownerCutPerMillion);
    }

    function pause() public onlyOwner {
        marketplace.pause();
    }

    function unpause() public onlyOwner {
        marketplace.unpause();
    }
}
