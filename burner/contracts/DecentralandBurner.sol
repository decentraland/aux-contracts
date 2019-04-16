pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

interface ERC20 {
    function burn(uint256 amount) external;
    function balanceOf(address who) external view returns (uint256);
}

contract DecentralandBurner is Ownable {
    ERC20 public mana;

    constructor(address manaAddress) public {
        mana = ERC20(manaAddress);
    }

    function execute(address payable _target, bytes calldata _bytes) 
    external 
    payable 
    onlyOwner 
    returns (bool success, bytes memory response)
    {
        // solium-disable-next-line security/no-call-value
        (success, response) = _target.call.value(msg.value)(_bytes);
    }

    function burn() external {
        mana.burn(mana.balanceOf(address(this)));
    }

    function isContractOwner(address _target) external view returns (bool) {
        return Ownable(_target).owner() == address(this);
    }
}
