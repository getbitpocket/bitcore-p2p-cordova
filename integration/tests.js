exports.defineAutoTests = function() {

    describe('Pool Tests', function() {

        it("seeding a pool via dns: if Pool.MaxConnectedPeers peers are connected, disconnect again", function(done) {
            var count = 0;

            var pool = new bitcore.p2p.Pool({
                network : 'testnet'
            });
            pool.connect();

            pool.on('peerready', function(peer) {
                console.log("Peer ready " + peer.host + ":" + peer.port);
                count++;

                if (count >= bitcore.p2p.Pool.MaxConnectedPeers) {
                    console.log(bitcore.p2p.Pool.MaxConnectedPeers + " Peers connected, disconnect now...");
                    pool.disconnect();
                }
            });

            pool.on('peerdisconnect', function(peer) {
                count--;
                console.log("Peer disconnected " + peer.host + ":" + peer.port);
                expect(true).toBe(true);

                if (count <= 0) {
                    done();
                }
            });
        });

    });

    describe('Peer Tests', function () {

        var peer;

        beforeEach(function(done) {
            cordova.plugins.dns.resolve('seed.bitcoin.sipa.be', function(ip) {
                peer = new bitcore.p2p.Peer({
                    host: ip
                });

                peer.connect();

                peer.on('ready', function () {
                    done()
                    console.log("Peer ready " + peer.host + ":" + peer.port);
                });
            });
        });

        afterEach(function(done) {
            peer.disconnect();

            peer.on('disconnect', function() {
                expect(true).toBe(true);
                done();
            });
        });

        it("ping / pong", function (done) {
            peer.on('pong', function(message) {
                console.log(message);
                expect(true).toBe(true);
                done();
            });

            peer.sendMessage(peer.messages.Ping());
        });

        it("bitcore and bitcore.p2p should be defined", function () {
            expect(cordova.plugins.dns).toBeDefined();
            expect(bitcore).toBeDefined();
            expect(bitcore.p2p).toBeDefined();
        });

    });

};