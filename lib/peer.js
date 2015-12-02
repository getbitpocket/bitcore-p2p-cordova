
var Buffer = require('buffer').Buffer;
var Buffers = require('../node_modules/bitcore-p2p/lib/buffers');
var EventEmitter = require('events').EventEmitter;
var bitcore = require('bitcore-lib');
var Networks = bitcore.Networks;
var Messages = require('../node_modules/bitcore-p2p/lib/messages');
var $ = bitcore.util.preconditions;
var util = require('util');

var peers = {};

function onReceive (info) {
    if (info.socketId in peers) {
        peers[info.socketId]._onReceive(info.data);
    }
};

function onReceiveError (info) {
    if (info.socketId in peers) {
        peers[info.socketId]._onError(info.resultCode);
    }
};

cordova.require('cordova/channel').onCordovaReady.subscribe(function() {
    if (typeof chrome === 'undefined') {
        throw new ReferenceError("TCP client sockets are missing.");
    }
    chrome.sockets.tcp.onReceive.addListener(onReceive);
    chrome.sockets.tcp.onReceiveError.addListener(onReceiveError);
});

function Peer (options) {
    var options = options || {};

    if (!(this instanceof Peer)) {
        return new Peer(options);
    }

    this.status = Peer.STATUS.DISCONNECTED;
    this.host = options.host || 'localhost';
    this.port = options.port;

    this.network = Networks.get(options.network) || Networks.defaultNetwork;

    if (!this.port) {
        this.port = this.network.port;
    }

    this.messages = new Messages({
        network: this.network,
        Block: bitcore.Block,
        Transaction: bitcore.Transaction
    });

    this.dataBuffer = new Buffers();

    this.version = 0;
    this.bestHeight = 0;
    this.subversion = null;
    this.relay = options.relay === false ? false : true;

    this.versionSent = false;

    // set message handlers
    var self = this;
    this.on('verack', function() {
        self.status = Peer.STATUS.READY;
        self.emit('ready');
    });

    this.on('version', function(message) {
        self.version = message.version;
        self.subversion = message.subversion;
        self.bestHeight = message.startHeight;

        var verackResponse = self.messages.VerAck();
        self.sendMessage(verackResponse);

        if(!self.versionSent) {
            self._sendVersion();
        }
    });

    this.on('ping', function(message) {
        self._sendPong(message.nonce);
    });

    return this;
};

util.inherits(Peer, EventEmitter);

Peer.MAX_RECEIVE_BUFFER = 10000000;
Peer.STATUS = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    READY: 'ready'
};

Peer.prototype._onReceive = function(data) {
    var buffer = new Buffer(new Uint8Array(data));
    this.dataBuffer.push(buffer);
    if (this.dataBuffer.length > Peer.MAX_RECEIVE_BUFFER) {
        return this.disconnect();
    }
    this._readMessage();
};

/**
 * Init the connection with the remote peer.
 * @returns {Peer} The same peer instance.
 */
Peer.prototype.connect = function() {
    var self = this;

    chrome.sockets.tcp.create(function(createInfo) {
        self.status = Peer.STATUS.CONNECTING;
        self.socketId = createInfo.socketId;
        peers[createInfo.socketId] = self;

        chrome.sockets.tcp.connect(self.socketId, self.host, self.port, function(result) {
            if (result === 0) {
                self.status = Peer.STATUS.CONNECTED;
                self.emit('connect');
                self._sendVersion();
            }
        });
    });

    return this;
};

Peer.prototype._onError = function(e) {
    this.emit('error', e);
    if (this.status !== Peer.STATUS.DISCONNECTED) {
        this.disconnect();
    }
};

/**
 * Disconnects the remote connection.
 * @returns {Peer} The same peer instance.
 */
Peer.prototype.disconnect = function() {
    var self = this;

    chrome.sockets.tcp.disconnect(self.socketId, function () {
        chrome.sockets.tcp.close(self.socketId);
        self.status = Peer.STATUS.DISCONNECTED;
        self.emit('disconnect');
    });

    return this;
};

/**
 * Send a Message to the remote peer.
 * @param {Message} message - A message instance
 */
Peer.prototype.sendMessage = function(message) {
    chrome.sockets.tcp.send(this.socketId, message.toBuffer().buffer);
};

/**
 * Internal function that sends VERSION message to the remote peer.
 */
Peer.prototype._sendVersion = function() {
    var message = this.messages.Version({relay: this.relay});
    this.sendMessage(message);
    this.versionSent = true;
};

/**
 * Send a PONG message to the remote peer.
 */
Peer.prototype._sendPong = function(nonce) {
    var message = this.messages.Pong(nonce);
    this.sendMessage(message);
};

/**
 * Internal function that tries to read a message from the data buffer
 */
Peer.prototype._readMessage = function() {
    var message = this.messages.parseBuffer(this.dataBuffer);
    if (message) {
        this.emit(message.command, message);
        this._readMessage();
    }
};

// currently only to fix tests
Peer.prototype._getSocket = function() {
    if (this.proxy) {
        var Client = require('socks5-client');
        return new Client();
    } else {
        var net = require('net');
        return new net.Socket();
    }
};

// currently only to fix tests
Peer.prototype.setProxy = function(host,port) {
    this.proxy = {
        'host' : host ,
        'port' : port
    };
    return this;
};

module.exports = Peer;