{
  const result = require('child_process').spawnSync('node', ['commonjs.js'], {
    cwd: __dirname,
    stdio: 'inherit',
  });
  if (result.status) process.exit(result.status);
}
if (parseInt(process.version.split('.')[0].substr(1), 10) >= 14) {
  const result = require('child_process').spawnSync('node', ['esm.mjs'], {
    cwd: __dirname,
    stdio: 'inherit',
  });
  if (result.status) process.exit(result.status);
}
