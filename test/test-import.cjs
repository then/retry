const {spawnSync} = require('child_process');
const {mkdtempSync, writeFileSync, mkdirSync, readFileSync} = require('fs');
const {tmpdir} = require('os');
const {join, resolve, relative} = require('path');

console.info(`$ npm pack`);
inheritExit(
  spawnSync(`npm`, [`pack`], {cwd: join(__dirname, `..`), stdio: `inherit`}),
);

const OUTPUTS = [
  {
    name: `test.cjs`,
    header: [
      `const { strictEqual } = require('assert');`,
      `const retry = require('then-retry');`,
    ],
  },
  {
    name: `test.mjs`,
    header: [
      `import { strictEqual } from 'assert';`,
      `import retry from 'then-retry';`,
    ],
  },
];

const assertions = (name) => [
  // Makes the script crash on unhandled rejections instead of silently
  // ignoring them. In the future, promise rejections that are not handled will
  // terminate the Node.js process with a non-zero exit code.
  `process.on('unhandledRejection', (err) => {`,
  `  throw err;`,
  `});`,
  `let n = 1;`,
  `retry(async () => {`,
  `  console.log('attempt ' + n++);`,
  `  if (n < 8) {`,
  `    throw new Error('not yet');`,
  `  }`,
  `}, { retryDelay: () => 0 }).then(() => {`,
  `  strictEqual(n, 8);`,
  `  console.log('✅ ${name} Tests Passed');`,
  `});`,
];

const dir = mkdtempSync(join(tmpdir(), `then-retry`));
for (const {name, header} of OUTPUTS) {
  writeFileSync(
    join(dir, name),
    [...header, ``, ...assertions(name), ``].join(`\n`),
  );
}

mkdirSync(join(dir, `src`));
writeFileSync(
  join(dir, `src`, `test.ts`),
  [
    `import { strictEqual } from 'assert';`,
    `import retry from 'then-retry';`,
    ``,
    `export async function flakeyFn(): Promise<number> {`,
    `  if (Math.random() < 0.2) throw new Error("oops");`,
    `  return 42;`,
    `}`,
    ``,
    `export async function reliableFn(): Promise<number> {`,
    `  return await retry(flakeyFn);`,
    `}`,
    ``,
    ...assertions(`TypeScript ' + process.argv[2] + '`),
    ``,
  ].join(`\n`),
);

writeFileSync(
  join(dir, `package.json`),
  JSON.stringify({
    name: 'then-retry-test-import',
    private: true,
    dependencies: {
      '@types/node': '^22.7.4',
      typescript: '5.6.2',
    },
    scripts: {
      typecheck: 'tsc --build',
    },
  }) + `\n`,
);

console.info(`$ npm install`);
inheritExit(spawnSync(`npm`, [`install`], {cwd: dir, stdio: `inherit`}));

const packPath = relative(
  join(dir, `package.json`),
  resolve(join(__dirname, `..`, `then-retry-0.0.0.tgz`)),
);
console.info(`$ npm install ${packPath}`);
inheritExit(
  spawnSync(`npm`, [`install`, packPath], {cwd: dir, stdio: `inherit`}),
);

for (const {name} of OUTPUTS) {
  console.info(`$ node ${join(dir, name)}`);
  inheritExit(
    spawnSync(`node`, [join(dir, name)], {cwd: dir, stdio: `inherit`}),
  );
}

const modes = [
  {module: 'commonjs', type: 'commonjs'},
  {module: 'nodenext', type: 'module'},
  {module: 'preserve', type: 'module'},
];
for (const mode of modes) {
  writeFileSync(
    join(dir, `tsconfig.json`),
    JSON.stringify({
      compilerOptions: {
        module: mode.module,
        outDir: 'lib',
        noImplicitAny: true,
        skipLibCheck: false,
        strict: true,
        isolatedModules: true,
        declaration: true,
      },
      include: ['src'],
    }) + `\n`,
  );

  writeFileSync(
    join(dir, `package.json`),
    JSON.stringify({
      name: 'then-retry-test-import',
      private: true,
      type: mode.type,
      dependencies: {
        '@types/node': '^17.0.21',
        typescript: '4.0.2',
      },
      scripts: {
        typecheck: 'tsc --build',
      },
    }) + `\n`,
  );

  console.info(`$ npm run typecheck`);
  inheritExit(
    spawnSync(`npm`, [`run`, `typecheck`], {cwd: dir, stdio: `inherit`}),
  );
  console.info(`$ node lib/test.js`);
  inheritExit(
    spawnSync(`node`, [`lib/test.js`, `${mode.module}/${mode.type}`], {
      cwd: dir,
      stdio: `inherit`,
    }),
  );
  mkdirSync(`test-output/${mode.module}-${mode.type}`, {recursive: true});
  for (const file of [`test.js`, `test.d.ts`]) {
    writeFileSync(
      `test-output/${mode.module}-${mode.type}/${file}`,
      readFileSync(join(dir, `lib`, file), `utf8`),
    );
  }
}

function inheritExit(proc) {
  if (proc.status !== 0) process.exit(proc.status);
}
