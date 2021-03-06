import assertRevert from './helpers/assertRevert'
import {
  Listing,
  ADDRESS_INDEXES,
  INITIAL_VALUE,
  ORDERS,
  BIDS
} from 'decentraland-contract-plugins'

const BN = web3.utils.BN
const expect = require('chai').use(require('bn-chai')(BN)).expect

const DecentralandBurner = artifacts.require('DecentralandBurner')

describe('DecentralandBurner', function() {
  this.timeout(10000)
  // Accounts
  let accounts
  let deployer
  let user
  let owner
  let anotherUser
  let fromOwner
  let fromUser
  let fromAnotherUser

  // Contracts
  let burnerContract
  let manaContract
  let erc721Contract
  let marketplaceContract
  let bidContract

  beforeEach(async function() {
    // Create Listing environment
    accounts = await web3.eth.getAccounts()
    deployer = accounts[ADDRESS_INDEXES.deployer]
    user = accounts[ADDRESS_INDEXES.user]
    anotherUser = accounts[ADDRESS_INDEXES.anotherUser]
    owner = accounts[Object.keys(ADDRESS_INDEXES).length]
    fromUser = { from: user }
    fromAnotherUser = { from: anotherUser }
    fromOwner = { from: owner }

    const fromDeployer = { from: deployer }
    const creationParams = {
      ...fromDeployer,
      gas: 6e6,
      gasPrice: 21e9
    }

    const listing = new Listing({ accounts, artifacts: global })
    await listing.deploy({ txParams: creationParams })

    const contracts = listing.getContracts()
    manaContract = contracts.manaContract
    erc721Contract = contracts.erc721Contract
    marketplaceContract = contracts.marketplaceContract
    bidContract = contracts.bidContract

    burnerContract = await DecentralandBurner.new(manaContract.address, {
      ...creationParams,
      ...fromOwner
    })

    await listing.setFees(1000)

    await marketplaceContract.transferOwnership(
      burnerContract.address,
      fromDeployer
    )
    await bidContract.transferOwnership(burnerContract.address, fromDeployer)
  })

  describe('isContractOwner', function() {
    it('should return if it is owner', async function() {
      let isOwner = await burnerContract.isContractOwner(
        marketplaceContract.address
      )

      expect(isOwner).to.be.equal(true)

      isOwner = await burnerContract.isContractOwner(bidContract.address)
      expect(isOwner).to.be.equal(true)
    })

    it('reverts if the target is does not implement owner()', async function() {
      await assertRevert(burnerContract.isContractOwner(user))
      await assertRevert(burnerContract.isContractOwner(erc721Contract.address))
    })
  })

  describe('execute', function() {
    it('should transfer owned contract ownership', async function() {
      let isOwner = await burnerContract.isContractOwner(
        marketplaceContract.address
      )
      let currentOwner = await marketplaceContract.owner()

      expect(isOwner).to.be.equal(true)
      expect(currentOwner).to.be.equal(burnerContract.address)

      const data = await marketplaceContract.contract.methods
        .transferOwnership(deployer)
        .encodeABI()

      const { logs } = await burnerContract.execute(
        marketplaceContract.address,
        data,
        fromOwner
      )

      expect(logs.length).to.be.equal(2)

      const log = logs[1]
      log.event.should.be.equal('Executed')
      log.args._target.should.be.equal(marketplaceContract.address)
      log.args._data.should.be.equal(data)

      isOwner = await burnerContract.isContractOwner(
        marketplaceContract.address
      )
      currentOwner = await marketplaceContract.owner()

      expect(isOwner).to.be.equal(false)
      expect(currentOwner).to.be.equal(deployer)
    })

    it('should return response if the call was a successs', async function() {
      const data = await marketplaceContract.contract.methods
        .orderByAssetId(erc721Contract.address, ORDERS.one.tokenId)
        .encodeABI()

      const res = await burnerContract.contract.methods
        .execute(marketplaceContract.address, data)
        .call(fromOwner)

      const order = web3.eth.abi.decodeParameters(
        ['bytes32', 'address', 'address', 'uint256', 'uint256'],
        res
      )

      expect(order[1]).to.be.equal(accounts[ORDERS.one.seller])
      expect(order[2]).to.be.equal(erc721Contract.address)
      expect(order[3]).to.be.equal(ORDERS.one.price)
    })

    it('should pause owned contract', async function() {
      let isPaused = await marketplaceContract.paused()
      expect(isPaused).to.be.equal(false)

      const data = await marketplaceContract.contract.methods
        .pause()
        .encodeABI()

      await burnerContract.execute(marketplaceContract.address, data, fromOwner)

      isPaused = await marketplaceContract.paused()
      expect(isPaused).to.be.equal(true)
    })

    it('reverts if call is not a success', async function() {
      const data = await manaContract.contract.methods
        .mint(owner, INITIAL_VALUE)
        .encodeABI()

      await assertRevert(
        burnerContract.execute(manaContract.address, data, fromOwner),
        'Call error'
      )
    })

    it('reverts if trying to call execute recursively', async function() {
      const data = await burnerContract.contract.methods
        .execute(burnerContract.address, '0x')
        .encodeABI()

      await assertRevert(
        burnerContract.execute(burnerContract.address, data, fromOwner),
        'Call error'
      )
    })

    it('reverts if not owner wants to execute', async function() {
      await assertRevert(
        burnerContract.execute(marketplaceContract.address, '0x')
      )
    })
  })

  describe('burn', function() {
    beforeEach(async function() {
      await manaContract.transfer(
        burnerContract.address,
        INITIAL_VALUE,
        fromUser
      )
    })

    it('should burn by owner', async function() {
      let balance = await manaContract.balanceOf(burnerContract.address)
      expect(balance).to.eq.BN(INITIAL_VALUE)

      await burnerContract.burn(fromOwner)

      balance = await manaContract.balanceOf(burnerContract.address)
      expect(balance).to.eq.BN(0)
    })

    it('should burn by anyone', async function() {
      let balance = await manaContract.balanceOf(burnerContract.address)
      expect(balance).to.eq.BN(INITIAL_VALUE)

      await burnerContract.burn(fromUser)

      balance = await manaContract.balanceOf(burnerContract.address)
      expect(balance).to.eq.BN(0)
    })
  })

  describe('End-2-end', function() {
    it('should burn fees froms marketplaces', async function() {
      this.timeout(100000)
      let balance = await manaContract.balanceOf(burnerContract.address)
      expect(balance).to.eq.BN(0)

      await marketplaceContract.executeOrder(
        erc721Contract.address,
        ORDERS.one.tokenId,
        ORDERS.one.price,
        fromAnotherUser
      )

      let prevBalance = await manaContract.balanceOf(burnerContract.address)
      expect(prevBalance).to.gt.BN(0)

      const bidId = (await bidContract.getBidByToken(
        erc721Contract.address,
        BIDS.one.tokenId,
        BIDS.one.index
      ))[0]

      // hack to solve web3js erros with promises. Should be solved by https://github.com/ethereum/web3.js/pull/2608
      try {
        await erc721Contract.methods[
          'safeTransferFrom(address,address,uint256,bytes)'
        ](anotherUser, bidContract.address, BIDS.one.tokenId, bidId, {
          ...fromAnotherUser,
          gas: 6e10,
          gasPrice: 21e9
        })
      } catch (e) {
        /* eslint-disable */
        if (
          e.message !== "Returned values aren't valid, did it run Out of Gas?"
        ) {
          throw e
        }
      }

      balance = await manaContract.balanceOf(burnerContract.address)
      expect(balance).to.gt.BN(prevBalance)

      await burnerContract.burn()

      balance = await manaContract.balanceOf(burnerContract.address)
      expect(balance).to.eq.BN(0)
    })
  })
})
