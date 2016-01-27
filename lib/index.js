/**
 * @namespace P2P
 */

module.exports = {
    Inventory:   require('../node_modules/bitcore-p2p/lib/inventory'),
    BloomFilter: require('../node_modules/bitcore-p2p/lib/bloomfilter'),
    Messages:    require('../node_modules/bitcore-p2p/lib/messages'),
    Peer:        require('./peer'),
    Pool:        require('./pool')
};
