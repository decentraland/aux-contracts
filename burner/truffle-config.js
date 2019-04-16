require('babel-register')
require('babel-polyfill')

module.exports = {
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    local: {
      host: 'localhost',
      port: 9545,
      gas: 6721975,
      network_id: '*' // eslint-disable-line camelcase
    },
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*' // eslint-disable-line camelcase
    },
    ropsten: {
      host: 'localhost',
      port: 8545,
      network_id: 3,
      gas: 30000000,
      from: '0x62ba62ff92917edf8ac0386fa10e3b27950bce8d'
    },
    coverage: {
      host: 'localhost',
      network_id: '*', // eslint-disable-line camelcase
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01
    },
    ganache: {
      host: 'localhost',
      port: 8555,
      network_id: '*' // eslint-disable-line camelcase
    }
  }
}