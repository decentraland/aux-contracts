
contract DecentralandWrappedVesting is TokenVesting {
  using SafeERC20 for ERC20;

  event LockedMANA(uint256 amount);
  event UnlockedMANA(uint256 amount);

  WrappedMANA public wrapToken;

  function DecentralandWrappedVesting(
    address               _beneficiary,
    uint256               _start,
    uint256               _cliff,
    uint256               _duration,
    bool                  _revocable,
    ERC20                 _token,
    WrappedMANA           _wrapToken
  )
    TokenVesting(_beneficiary, _start, _cliff, _duration, _revocable, _token)
  {
    wrapToken = WrappedMANA(_wrapToken);
  }

  function deposit(uint256 amount) onlyBeneficiary public {
    _token.approve(wrapToken.address, 0);
    _token.approve(wrapToken.address, amount);
    wrapToken.deposit(amount);
    LockedMANA(amount);
  }
  function withdraw(uint256 amount) onlyBeneficiary public {
    wrapToken.withdraw(amount);
    UnlockedMANA(amount);
  }
}
