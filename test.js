var assert = require('assert');
var LogootText = require('./lib/logoot-text');

// Start with 2 empty strings
var lA = new LogootText('A');
var lB = new LogootText('B');

lA.on('logoot.op', replAToB);
function replAToB (op) {
  lB.applyOp(op);
}

lB.on('logoot.op', replBToA);
function replBToA (op) {
  lA.applyOp(op);
}

lA.ins(0, 'xyz');

function disconnect (lA, lB) {
  lA.removeListener('logoot.op', replAToB);
  lB.removeListener('logoot.op', replBToA);
  var opsA = [];
  var opsB = [];
  lA.on('logoot.op', bufferA);
  function bufferA (op) {
    opsA.push(op);
  }
  lB.on('logoot.op', bufferB);
  function bufferB (op) {
    opsB.push(op);
  }
  function reconnect () {
    lA.removeListener('logoot.op', bufferA);
    lB.removeListener('logoot.op', bufferB);
    var i, l;
    for (i = 0, l = opsA.length; i < l; i++) {
      lB.applyOp(opsA[i]);
    }
    for (i = 0, l = opsB.length; i < l; i++) {
      lA.applyOp(opsB[i]);
    }
  }
  return reconnect;
}

reconnect = disconnect(lA, lB);

assert.equal(lA.str, 'xyz');
assert.equal(lB.str, 'xyz');

lA.del(1);
assert.equal(lA.str, 'xz')
lA.ins(0, 'fff');
assert.equal(lA.str, 'fffxz')

lB.ins(2, 'abc');
assert.equal(lB.str, 'xyabcz')
lB.del(0);
assert.equal(lB.str, 'yabcz');

reconnect();

assert.equal(lA.str, 'fffabcz');
assert.equal(lB.str, 'fffabcz');
