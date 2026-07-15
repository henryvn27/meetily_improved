import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import waitOn from 'wait-on';

const root = fileURLToPath(new URL('../', import.meta.url));
const devServerUrl = 'http://127.0.0.1:3120';
const packageManager = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const updateVisuals = process.argv.includes('--update');
const wdioArguments = process.argv.slice(2).filter((argument) => argument !== '--update' && argument !== '--');
let runner;

async function assertPortIsFree() {
  try {
    await waitOn({ resources: [devServerUrl], timeout: 750 });
  } catch {
    return;
  }

  throw new Error(`Refusing to reuse ${devServerUrl}; another process already owns the browser-QA port.`);
}

async function stopProcess(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;

  child.kill('SIGTERM');
  await Promise.race([
    once(child, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);

  if (child.exitCode === null && child.signalCode === null) {
    child.kill('SIGKILL');
    await once(child, 'exit');
  }
}

await assertPortIsFree();

const server = spawn(packageManager, ['exec', 'next', 'dev', '-p', '3120'], {
  cwd: root,
  env: {
    ...process.env,
    NEXT_PUBLIC_MEETILY_NATIVE_QA_MODE: 'routes',
    NEXT_PUBLIC_MEETILY_BROWSER_QA: 'true',
  },
  stdio: 'inherit',
});

const serverExited = once(server, 'exit').then(([code, signal]) => {
  throw new Error(`Next.js QA server exited before it was ready (code=${code}, signal=${signal}).`);
});

const forwardSignal = async (signal) => {
  await stopProcess(runner);
  await stopProcess(server);
  process.kill(process.pid, signal);
};

process.once('SIGINT', () => void forwardSignal('SIGINT'));
process.once('SIGTERM', () => void forwardSignal('SIGTERM'));

try {
  await Promise.race([
    waitOn({ resources: [devServerUrl], timeout: 120_000, interval: 1_000 }),
    serverExited,
  ]);

  runner = spawn(packageManager, ['exec', 'wdio', 'run', 'tests/e2e/wdio.browser.conf.mjs', ...wdioArguments], {
    cwd: root,
    env: {
      ...process.env,
      ...(updateVisuals ? { MEETILY_UPDATE_VISUALS: '1' } : {}),
    },
    stdio: 'inherit',
  });

  const [code, signal] = await once(runner, 'exit');
  if (signal) {
    throw new Error(`WebdriverIO browser QA was terminated by ${signal}.`);
  }
  process.exitCode = code ?? 1;
} finally {
  await stopProcess(server);
}
