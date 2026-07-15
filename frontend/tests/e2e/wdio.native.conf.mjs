import { resolve } from 'node:path';

const root = process.cwd();
const binary = process.env.MEETILY_WDIO_BINARY || resolve(root, '../target/debug/meetily');

export const config = {
  runner: 'local',
  specs: [resolve(root, 'tests/e2e/specs/native/**/*.spec.mjs')],
  maxInstances: 1,
  capabilities: [{
    browserName: 'tauri',
    'tauri:options': {
      application: binary,
    },
  }],
  services: [['@wdio/tauri-service', {
    appBinaryPath: binary,
    driverProvider: 'embedded',
    embeddedPort: 4445,
    captureFrontendLogs: true,
    captureBackendLogs: true,
  }]],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    timeout: 180_000,
  },
  logLevel: process.env.CI ? 'info' : 'warn',
  waitforTimeout: 20_000,
  connectionRetryTimeout: 180_000,
  connectionRetryCount: 1,
};
