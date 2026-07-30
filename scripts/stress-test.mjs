import { spawn } from "node:child_process";

const target = new URL(process.env.STRESS_BASE_URL ?? "http://127.0.0.1:3102");
const allowRemote = process.env.ALLOW_REMOTE_STRESS === "1";
const loopbackHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

if (!loopbackHosts.has(target.hostname) && !allowRemote) {
  console.error(
    `Refusing remote stress target ${target.origin}. Set ALLOW_REMOTE_STRESS=1 only after explicit authorization.`,
  );
  process.exit(2);
}

const scenarios = [
  { name: "average", requests: 100, concurrency: 10, maxP95Ms: 750, minRps: 25 },
  { name: "stress", requests: 400, concurrency: 40, maxP95Ms: 1_200, minRps: 25 },
  { name: "spike", requests: 160, concurrency: 80, maxP95Ms: 1_500, minRps: 25 },
];
const paths = ["/", "/robots.txt", "/manifest.webmanifest"];

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)] ?? 0;
}

async function waitForServer(url, timeoutMs = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(new URL("/", url), { redirect: "manual" });
      if (response.status < 500) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function runScenario(scenario) {
  const durations = [];
  let failures = 0;
  let cursor = 0;
  const startedAt = performance.now();

  async function worker() {
    while (cursor < scenario.requests) {
      const index = cursor;
      cursor += 1;
      const requestStartedAt = performance.now();
      try {
        const response = await fetch(new URL(paths[index % paths.length], target), {
          headers: { accept: "text/html,application/manifest+json;q=0.9,*/*;q=0.8" },
          redirect: "manual",
          signal: AbortSignal.timeout(10_000),
        });
        await response.arrayBuffer();
        if (response.status >= 500) failures += 1;
      } catch {
        failures += 1;
      } finally {
        durations.push(performance.now() - requestStartedAt);
      }
    }
  }

  await Promise.all(Array.from({ length: scenario.concurrency }, () => worker()));
  const elapsedSeconds = (performance.now() - startedAt) / 1_000;
  const p95Ms = percentile(durations, 0.95);
  const errorRate = failures / scenario.requests;
  const rps = scenario.requests / elapsedSeconds;
  const result = {
    name: scenario.name,
    requests: scenario.requests,
    concurrency: scenario.concurrency,
    failures,
    errorRate: Number(errorRate.toFixed(4)),
    p95Ms: Number(p95Ms.toFixed(1)),
    rps: Number(rps.toFixed(1)),
  };
  console.log(JSON.stringify(result));

  if (errorRate > 0.01 || p95Ms > scenario.maxP95Ms || rps < scenario.minRps) {
    throw new Error(
      `${scenario.name} missed thresholds (errorRate<=0.01, p95<=${scenario.maxP95Ms}ms, rps>=${scenario.minRps})`,
    );
  }
}

let server;
const shouldStartServer = !process.env.STRESS_BASE_URL;

try {
  if (shouldStartServer) {
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", target.port], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let serverOutput = "";
    server.stdout.on("data", (chunk) => { serverOutput += String(chunk); });
    server.stderr.on("data", (chunk) => { serverOutput += String(chunk); });
    server.on("exit", (code) => {
      if (code && code !== 0) console.error(serverOutput);
    });
  }

  await waitForServer(target);
  for (const scenario of scenarios) await runScenario(scenario);
} finally {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise((resolve) => {
      server.once("exit", resolve);
      setTimeout(resolve, 5_000);
    });
  }
}
