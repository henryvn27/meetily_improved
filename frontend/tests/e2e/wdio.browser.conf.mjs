import { resolve } from 'node:path';

const root = process.cwd();
const updateVisuals = process.env.MEETILY_UPDATE_VISUALS === '1';
const devServerUrl = 'http://127.0.0.1:3120';

export const config = {
  runner: 'local',
  specs: [resolve(root, 'tests/e2e/specs/browser/**/*.spec.mjs')],
  maxInstances: 1,
  capabilities: [{
    browserName: 'tauri',
    'wdio:tauriServiceOptions': {
      mode: 'browser',
      devServerUrl,
    },
    'goog:chromeOptions': {
      args: [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1280,820',
      ],
    },
  }],
  services: [
    ['@wdio/tauri-service', {
      mode: 'browser',
      devServerUrl,
    }],
    ['visual', {
      baselineFolder: resolve(root, 'tests/e2e/baselines/browser'),
      screenshotPath: resolve(root, 'tests/e2e/artifacts/browser-visual'),
      formatImageName: '{tag}-{width}x{height}',
      autoSaveBaseline: updateVisuals,
      alwaysSaveActualImage: true,
      clearRuntimeFolder: true,
      disableCSSAnimation: true,
    }],
  ],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    timeout: 120_000,
  },
  logLevel: process.env.CI ? 'info' : 'warn',
  waitforTimeout: 15_000,
  connectionRetryTimeout: 120_000,
  connectionRetryCount: 1,
};
