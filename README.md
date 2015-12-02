[![Build Status](https://travis-ci.org/getbitpocket/bitcore-p2p-cordova.svg?branch=master)](https://travis-ci.org/getbitpocket/bitcore-p2p-cordova)

## Interface to the bitcoin P2P network for Cordova/Phonegap apps

## Getting Started

Using it inside a Cordova/Phonegap app requires the chrome.socket.tcp plugin, which can be installed in your app like this:

```sh
cordova plugin add https://github.com/MobileChromeApps/cordova-plugin-chrome-apps-sockets-tcp.git
```

Additionally, the generated `bitcore-p2p.js` file has to be added in your `index.html`. The module is exposed on the `bitcore.P2P` namespace.

### Example: Connecting to a Peer

```javascript
var peer = new bitcore.P2P.Peer({host:'bitcoin-peer-ip'});

peer.on('ready',function(message) {
  console.log("version: " + peer.version + ", best height: " + peer.bestHeight);
});

peer.on('inv',function(message) {
  console.log("received inv message");
});

peer.connect();
```

## Build

```sh
npm install
gulp build
```


