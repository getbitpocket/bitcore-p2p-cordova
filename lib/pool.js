'use strict';

var EventEmitter = require('events').EventEmitter;
var bitcore = require('bitcore-lib');
var sha256 = bitcore.crypto.Hash.sha256;
var Peer = require('./peer');
var Networks = bitcore.Networks;
var util = require('util');

function now() {
    return Math.floor(new Date().getTime() / 1000);
}

function Pool(options) {
    /* jshint maxcomplexity: 10 */
    /* jshint maxstatements: 20 */

    var self = this;

    options = options || {};
    this.keepalive = false;

    this._connectedPeers = {};
    this._addrs = [];

    this.listenAddr = options.listenAddr !== false;
    this.dnsSeed = options.dnsSeed !== false;
    this.maxSize = options.maxSize || Pool.MaxConnectedPeers;
    this.messages = options.messages;
    this.network = Networks.get(options.network) || Networks.defaultNetwork;
    this.relay = options.relay === false ? false : true;

    this.on('seed', function (ips) {
        ips.forEach(function(ip) {
            self._addAddr({
                ip: {
                    v4: ip
                }
            });
        });
        if (self.keepalive) {
            self._fillConnections();
        }
    });

    this.on('peerdisconnect', function (peer, addr) {
        self._removeConnectedPeer(addr);
        if (self.keepalive) {
            self._fillConnections();
        }
    });

    return this;

}

util.inherits(Pool, EventEmitter);

Pool.MaxConnectedPeers = 8;
Pool.RetrySeconds = 30;
Pool.PeerEvents = ['version', 'inv', 'getdata', 'ping', 'pong', 'addr',
    'getaddr', 'verack', 'reject', 'alert', 'headers', 'block', 'merkleblock',
    'tx', 'getblocks', 'getheaders', 'error', 'filterload', 'filteradd',
    'filterclear'
];

/**
 * Will initiatiate connection to peers, if available peers have been added to
 * the pool, it will connect to those, otherwise will use DNS seeds to find
 * peers to connect. When a peer disconnects it will add another.
 */
Pool.prototype.connect = function () {
    this.keepalive = true;
    var self = this;
    if (this.dnsSeed) {
        self._addAddrsFromSeeds();
    } else {
        self._fillConnections();
    }
    return this;
};

/**
 * Will disconnect all peers that are connected.
 */
Pool.prototype.disconnect = function () {
    this.keepalive = false;
    for (var i in this._connectedPeers) {
        this._connectedPeers[i].disconnect();
    }
    return this;
};

/**
 * @returns {Number} The number of peers currently connected.
 */
Pool.prototype.numberConnected = function () {
    return Object.keys(this._connectedPeers).length;
};

/**
 * Will fill the conneted peers to the maximum amount.
 */
Pool.prototype._fillConnections = function () {
    var length = this._addrs.length;
    for (var i = 0; i < length; i++) {
        if (this.numberConnected() >= this.maxSize) {
            break;
        }
        var addr = this._addrs[i];
        if (!addr.retryTime || now() > addr.retryTime) {
            this._connectPeer(addr);
        }
    }
    return this;
};

/**
 * Will remove a peer from the list of connected peers.
 * @param {Object} addr - An addr from the list of addrs
 */
Pool.prototype._removeConnectedPeer = function (addr) {
    if (this._connectedPeers[addr.hash].status !== Peer.STATUS.DISCONNECTED) {
        this._connectedPeers[addr.hash].disconnect();
    } else {
        delete this._connectedPeers[addr.hash];
    }
    return this;
};

/**
 * Will connect a peer and add to the list of connected peers.
 * @param {Object} addr - An addr from the list of addrs
 */
Pool.prototype._connectPeer = function (addr) {
    var self = this;

    if (!this._connectedPeers[addr.hash]) {
        var port = addr.port || self.network.port;
        var ip = addr.ip.v4 || addr.ip.v6;
        var peer = new Peer({
            host: ip,
            port: port,
            messages: self.messages,
            network: this.network,
            relay: self.relay
        });

        peer.on('connect', function peerConnect() {
            self.emit('peerconnect', peer, addr);
        });

        self._addPeerEventHandlers(peer, addr);
        peer.connect();
        self._connectedPeers[addr.hash] = peer;
    }

    return this;
};

/**
 * Will add disconnect and ready events for a peer and intialize
 * handlers for relay peer message events.
 */
Pool.prototype._addPeerEventHandlers = function(peer, addr) {
    var self = this;

    peer.on('disconnect', function peerDisconnect() {
        self.emit('peerdisconnect', peer, addr);
    });
    peer.on('ready', function peerReady() {
        self.emit('peerready', peer, addr);
    });
    Pool.PeerEvents.forEach(function addPeerEvents(event) {
        peer.on(event, function peerEvent(message) {
            self.emit('peer' + event, peer, message);
        });
    });
};

/**
 * Will add an addr to the beginning of the addrs array
 * @param {Object}
 */
Pool.prototype._addAddr = function (addr) {
    // Use default port if not specified
    addr.port = addr.port || this.network.port;

    // make a unique key
    addr.hash = sha256(new Buffer(addr.ip.v6 + addr.ip.v4 + addr.port)).toString('hex');

    var length = this._addrs.length;
    var exists = false;
    for (var i = 0; i < length; i++) {
        if (this._addrs[i].hash === addr.hash) {
            exists = true;
        }
    }
    if (!exists) {
        this._addrs.unshift(addr);
    }
    return addr;
};

/**
 * Will add addrs to the list of addrs from a DNS seed
 * @param {String} seed - A domain name to resolve known peers
 * @param {Function} done
 */
Pool.prototype._addAddrsFromSeed = function (seed) {
    var self = this;

    cordova.plugins.dns.resolveAll(seed,function (ips) {
        if (!ips || !ips.length) {
            self.emit('seederror', new Error('No IPs found from seed lookup.'));
            return;
        }
        self.emit('seed', ips);
    },function(error) {
        if (error) {
            self.emit('seederror', error);
        }
    });

    return this;
};

/**
 * Will add addrs to the list of addrs from network DNS seeds
 * @param {Function} done
 */
Pool.prototype._addAddrsFromSeeds = function () {
    var self = this;
    var seeds = this.network.dnsSeeds;
    seeds.forEach(function(seed) {
        self._addAddrsFromSeed(seed);
    });
    return this;
};

module.exports = Pool;
