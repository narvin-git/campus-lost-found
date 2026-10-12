// Response-time benchmark for local vs cloud.
//
// Usage (from the project root):
//   node scripts/perf.js <BASE_URL> --env local|cloud [--runs 20]
//
// Examples:
//   node scripts/perf.js http://localhost --env local          (via XAMPP Apache)
//   node scripts/perf.js http://localhost:3000 --env local     (direct to Node)
//   node scripts/perf.js https://<your-app>.onrender.com --env cloud
//
// For each endpoint it sends one warm-up request (reported separately, excluded
// from stats: on Render free tier this absorbs the cold start), then N timed requests.
// TTFB = time until response headers arrive; Total = time until body fully read.
// Outputs: results/<env>.csv (every request) and results/<env>_summary.csv.

const fs = require("fs");
const path = require("path");

const ENDPOINTS = ["/", "/api/items"];

function parseArgs(argv) {
  const opts = { baseUrl: null, env: null, runs: 20 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--env") opts.env = argv[++i];
    else if (argv[i] === "--runs") opts.runs = Number(argv[++i]);
    else if (!opts.baseUrl) opts.baseUrl = argv[i].replace(/\/+$/, "");
  }
  if (!opts.baseUrl || !["local", "cloud"].includes(opts.env) || !(opts.runs > 0)) {
    console.error("Usage: node scripts/perf.js <BASE_URL> --env local|cloud [--runs 20]");
    process.exit(1);
  }
  return opts;
}

async function timeRequest(url) {
  const start = performance.now();
  // no-cache so neither the browser-style cache nor a proxy short-circuits the test
  const res = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
  const ttfb = performance.now() - start;
  const body = await res.arrayBuffer();
  const total = performance.now() - start;
  return { status: res.status, ttfb, total, bytes: body.byteLength };
}

function stats(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const median = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  return {
    min: s[0],
    avg: s.reduce((a, b) => a + b, 0) / s.length,
    median,
    max: s[s.length - 1],
  };
}

const ms = (n) => n.toFixed(1);

async function main() {
  const { baseUrl, env, runs } = parseArgs(process.argv.slice(2));
  const resultsDir = path.join(__dirname, "..", "results");
  fs.mkdirSync(resultsDir, { recursive: true });

  const rows = [["timestamp", "env", "endpoint", "run", "warmup", "status", "ttfb_ms", "total_ms", "bytes"]];
  const summary = [["env", "endpoint", "runs", "metric", "min_ms", "avg_ms", "median_ms", "max_ms", "warmup_total_ms"]];

  console.log(`Target: ${baseUrl}  env=${env}  runs=${runs} per endpoint\n`);

  for (const endpoint of ENDPOINTS) {
    const url = baseUrl + endpoint;

    const warm = await timeRequest(url);
    rows.push([new Date().toISOString(), env, endpoint, 0, "yes", warm.status, ms(warm.ttfb), ms(warm.total), warm.bytes]);
    console.log(`${endpoint}  warm-up: ${warm.status}  TTFB ${ms(warm.ttfb)} ms  total ${ms(warm.total)} ms`);

    const results = [];
    for (let i = 1; i <= runs; i++) {
      const r = await timeRequest(url);
      results.push(r);
      rows.push([new Date().toISOString(), env, endpoint, i, "no", r.status, ms(r.ttfb), ms(r.total), r.bytes]);
    }

    const failed = results.filter((r) => r.status >= 400).length;
    if (failed) console.warn(`  WARNING: ${failed}/${runs} requests returned an error status (rate limiter on? DB down?)`);

    for (const [metric, key] of [["ttfb", "ttfb"], ["total", "total"]]) {
      const st = stats(results.map((r) => r[key]));
      summary.push([env, endpoint, runs, metric, ms(st.min), ms(st.avg), ms(st.median), ms(st.max), ms(warm.total)]);
      console.log(
        `  ${metric.padEnd(5)}  min ${ms(st.min).padStart(8)}  avg ${ms(st.avg).padStart(8)}  median ${ms(st.median).padStart(8)}  max ${ms(st.max).padStart(8)}  (ms)`
      );
    }
    console.log();
  }

  const toCsv = (data) => data.map((r) => r.join(",")).join("\n") + "\n";
  fs.writeFileSync(path.join(resultsDir, `${env}.csv`), toCsv(rows));
  fs.writeFileSync(path.join(resultsDir, `${env}_summary.csv`), toCsv(summary));
  console.log(`Saved results/${env}.csv and results/${env}_summary.csv`);
}

main().catch((err) => {
  console.error(`Request failed: ${err.cause?.code || err.message}`);
  process.exit(1);
});
