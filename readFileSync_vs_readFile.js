const fs = require('fs');
const util = require('util');
const addon = require('./');

const myReadPromisified = util.promisify(addon.read);

const readFile = util.promisify(fs.readFile);

fs.writeFileSync('a', 'a');

const attempts = 100000;

function runInCallback(left, cb) {
  fs.readFile('a', () => {
    if (left > 0) {
      runInCallback(left - 1, cb);
    } else {
      cb();
    }
  });
}

function readStraightForward(callback) {
  // Implementation like in: https://github.com/nodejs/node/blob/v10.x/lib/fs.js
  fs.open('a', 'r', 0o666, (err, fd) => {
    if (err) {
      callback(err);
      return;
    }
    fs.fstat(fd, (err, stat) => {
      if (err) {
        callback(err);
        return;
      }
      const buffer = Buffer.allocUnsafe(stat.size);
      fs.read(fd, buffer, 0, stat.size, null, (err) => {
        if (err) {
          callback(err);
          return;
        }
        fs.close(fd, () => {
          callback(null, buffer);
        });
      });
    });
  });
}

const readStraightForwardPromisified = util.promisify(readStraightForward);

(async () => {
  console.time('sync');
  for (let i = 0; i < attempts; i++) {
    fs.readFileSync('a');
  }
  console.timeEnd('sync');

  console.time('myReadPromisified');
  for (let i = 0; i < attempts; i++) {
    await myReadPromisified();
  }
  console.timeEnd('myReadPromisified');

  console.time('async');
  for (let i = 0; i < attempts; i++) {
    await readFile('a');
  }
  console.timeEnd('async');

  console.time('callback');
  await new Promise(r => runInCallback(attempts, r));
  console.timeEnd('callback');

  console.time('nextTick');
  for (let i = 0; i < attempts; i++) {
    await new Promise(r => setImmediate(r));
  }
  console.timeEnd('nextTick');

  console.time('readStraightForward');
  for (let i = 0; i < attempts; i++) {
    await readStraightForwardPromisified();
  }
  console.timeEnd('readStraightForward');
})().catch(e => console.log(e));
