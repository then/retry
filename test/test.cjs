const {strictEqual} = require('assert');
const retry = require('then-retry');

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err;
});

let n = 1;
retry(
  async () => {
    console.log('attempt ' + n++);
    if (n < 8) {
      throw new Error('not yet');
    }
  },
  {retryDelay: () => 0},
).then(() => {
  strictEqual(n, 8);
  console.log('✅ CommonJS Tests Passed');
});
