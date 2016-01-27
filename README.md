[![Build Status](https://travis-ci.org/getbitpocket/bitcore-p2p-cordova.svg?branch=master)](https://travis-ci.org/getbitpocket/bitcore-p2p-cordova)

## Interface to the bitcoin P2P network for Cordova/Phonegap apps

## Getting Started

 - Add the Plugin to your Cordova project: `cordova plugin add cordova-bitcore-plugin`
 - Inside the `index.html` of your Cordova project add the script: `<script type="text/javascript" src="cordova-bitcore.js"></script>` (A better solution might be found in the future, which makes this obsolete, however for now it is problematic to automatically add browserified js files)

### Example: Connecting to a Peer

```javascript
var peer = new bitcore.p2p.Peer({host:'bitcoin-peer-ip'});

peer.on('ready',function(message) {
  console.log("version: " + peer.version + ", best height: " + peer.bestHeight);
});

peer.on('inv',function(message) {
  console.log("received inv message");
});

peer.connect();
```

### Example: Connecting a Pool

```javascript
var pool = new bitcore.p2p.Pool({
    network : 'testnet'
});

pool.on('peerready', function(peer) {
    console.log("Peer ready " + peer.host + ":" + peer.port);    
});

pool.connect();
```

## Build

```sh
npm install
gulp build
```

## Running Unit Tests

```sh
npm install
gulp test
```
## Running Cordova Tests

 - Add tests as plugin `cordova plugin add https://github.com/getbitpocket/bitcore-p2p-cordova.git#:/integration`
 - Follow the [Cordova Plugins Tests](https://github.com/apache/cordova-plugin-test-framework#running-plugin-tests) guide
 - Run the tests by launching app `cordova emulate`


