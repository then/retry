module.exports = function run(retry) {
  let n = 1;
  retry(async () => {
    console.log('attempt ' + n++);
    if (n < 8) {
      throw new Error('not yet');
    }
  });
};
