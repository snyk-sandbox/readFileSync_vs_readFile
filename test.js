var addon = require('./');

addon.read(
  function(err, sum) {
    console.log(err, sum);
  }
);

