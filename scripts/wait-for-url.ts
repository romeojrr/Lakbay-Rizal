// Waits until a URL answers (used by Playwright so the two test builds do not run at once).
const url = process.argv[2];
const timeoutMs = Number(process.argv[3] ?? 180_000);
if (!url) {
  console.error('usage: tsx scripts/wait-for-url.ts <url> [timeoutMs]');
  process.exit(1);
}

const start = Date.now();
for (;;) {
  try {
    const response = await fetch(url);
    if (response.ok) process.exit(0);
  } catch {
    // not up yet
  }
  if (Date.now() - start > timeoutMs) {
    console.error(`wait-for-url: ${url} did not answer within ${timeoutMs} ms`);
    process.exit(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}
