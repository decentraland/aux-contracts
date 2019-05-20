
// File: openzeppelin-solidity/contracts/ownership/Ownable.sol

pragma solidity ^0.5.2;

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor () internal {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), _owner);
    }

    /**
     * @return the address of the owner.
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(isOwner());
        _;
    }

    /**
     * @return true if `msg.sender` is the owner of the contract.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     * @notice Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function transferOwnership(address newOwner) public onlyOwner {
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address newOwner) internal {
        require(newOwner != address(0));
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

// File: contracts/DecentralandBurner.sol

pragma solidity ^0.5.0;


interface ERC20 {
    function burn(uint256 amount) external;
    function balanceOf(address who) external view returns (uint256);
}

contract DecentralandBurner is Ownable {
    ERC20 public mana;
    event Executed(address indexed _target, bytes _data);

    /**
    * @dev Constructor of the contract.
    * @param _mana - address for the mana contract.
    */
    constructor(address _mana) public {
        mana = ERC20(_mana);
    }

    /**
    * @dev Execute a target function with value and data.
    * @notice This function can be only called by the owner of the contract.
    * The msg.sender of the call will be this contract address.
    * The msg.data will be whatever it is on _data parameter.
    * _data should start with 4 bytes related to a function selector 0x12345678....
    * If you send ETH to this method, it will be redirected to the target.
    * @param _target - address for the target contract.
    * @param _data - bytes for the msg.data.
    * @return response - bytes for the call response.
    */
    function execute(address payable _target, bytes calldata _data) 
    external 
    payable 
    onlyOwner 
    returns (bytes memory)
    {
        // solium-disable-next-line security/no-call-value
        (bool success, bytes memory response) = _target.call.value(msg.value)(_data);

        if (!success) {
            revert("Call error");
        }
        
        emit Executed(_target, _data);

        return response;
    }

    /**
    * @dev Burn MANA owned by this contract 
    */
    function burn() external {
        mana.burn(mana.balanceOf(address(this)));
    }

    /**
    * @dev Check whether a contract is owned by this contract.
    * @notice If the _target contract is not a contract or not implement
    * owner() function, the call will fail.
    * @param _target - address for the target contract.
    * @return bool whether the _target contract is owned by this contract or not.
    */
    function isContractOwner(address _target) external view returns (bool) {
        return Ownable(_target).owner() == address(this);
    }
}
