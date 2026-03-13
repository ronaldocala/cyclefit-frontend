const net = require("net");
const { spawn } = require("child_process");

const DEFAULT_PORT = 8081;
const MAX_PORT = 8100;
const RETRY_DELAY_MS = 5000;
const RETRIABLE_TUNNEL_ERRORS = [
  "failed to start tunnel",
  "remote gone away",
  "session closed",
  "read econnreset",
  "ngrok tunnel took too long to connect",
  "err_ngrok_108",
];

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });
}

async function findAvailablePort(startPort) {
  for (let port = startPort; port <= MAX_PORT; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found between ${startPort} and ${MAX_PORT}.`);
}

function isRetriableTunnelFailure(output) {
  const normalized = output.toLowerCase();
  return RETRIABLE_TUNNEL_ERRORS.some((pattern) => normalized.includes(pattern));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runExpoWithRetries(port) {
  const expoCli = require.resolve("expo/bin/cli");
  const args = [expoCli, "start", "--host", "tunnel", "--go", "--port", String(port)];

  if (port !== DEFAULT_PORT) {
    console.log(`Port ${DEFAULT_PORT} is busy, starting tunnel on ${port} instead.`);
  }

  for (;;) {
    const result = await new Promise((resolve) => {
      const child = spawn(process.execPath, args, {
        cwd: process.cwd(),
        env: process.env,
        stdio: ["inherit", "pipe", "pipe"],
      });

      let combinedOutput = "";
      const appendOutput = (chunk, writer) => {
        const text = chunk.toString();
        combinedOutput += text;
        writer.write(text);
      };

      child.stdout.on("data", (chunk) => appendOutput(chunk, process.stdout));
      child.stderr.on("data", (chunk) => appendOutput(chunk, process.stderr));

      child.on("exit", (code, signal) => {
        resolve({ code, signal, combinedOutput });
      });
    });

    if (result.signal) {
      process.kill(process.pid, result.signal);
      return;
    }

    if ((result.code ?? 1) === 0) {
      process.exit(0);
      return;
    }

    if (!isRetriableTunnelFailure(result.combinedOutput)) {
      process.exit(result.code ?? 1);
      return;
    }

    console.error(`Tunnel startup failed. Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    await delay(RETRY_DELAY_MS);
  }
}

async function main() {
  const port = await findAvailablePort(DEFAULT_PORT);
  await runExpoWithRetries(port);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
