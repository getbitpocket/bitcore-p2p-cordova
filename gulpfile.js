var gulp  = require('gulp');
var shell = require('gulp-shell');
var mocha = require('gulp-mocha');

var commands = [
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/addr.js:./commands/addr"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/alert.js:./commands/alert"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/block.js:./commands/block"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/filteradd.js:./commands/filteradd"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/filterclear.js:./commands/filterclear"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/filterload.js:./commands/filterload"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/getaddr.js:./commands/getaddr"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/getblocks.js:./commands/getblocks"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/getdata.js:./commands/getdata"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/getheaders.js:./commands/getheaders"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/headers.js:./commands/headers"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/inv.js:./commands/inv"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/mempool.js:./commands/mempool"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/merkleblock.js:./commands/merkleblock"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/notfound.js:./commands/notfound"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/ping.js:./commands/ping"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/pong.js:./commands/pong"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/reject.js:./commands/reject"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/tx.js:./commands/tx"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/verack.js:./commands/verack"' ,
    ' -r "./node_modules/bitcore-p2p/lib/messages/commands/version.js:./commands/version"'
];

var browserifyCommand = 'browserify -s bitcore -o build/cordova-bitcore.js';

commands.forEach(function (command) {
    browserifyCommand += command;
});

browserifyCommand += ' index.js';

gulp.task('build', shell.task([
    browserifyCommand
]));

gulp.task('test', function(done) {
    return gulp.src(['test/**/*.spec.js'], { read: false })
        .pipe(mocha({
            reporter: 'spec'
        }));
});