import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
export const TRANSACTION_LOG_PATH = path.join(LOG_DIR, "transactions.log");
export const TRANSACTION_JSONL_PATH = path.join(LOG_DIR, "transactions.jsonl");

function ensureLogDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch {
    // Ignore on read-only serverless filesystems if any
  }
}

export function maskSecret(val?: string | null): string {
  if (!val) return "";
  if (val.length <= 12) return "***";
  return `${val.slice(0, 9)}...${val.slice(-4)}`;
}

export function sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
  if (!headers) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (/authorization|key|secret|token|pass/i.test(k)) {
      const parts = v.split(" ");
      if (parts.length === 2) {
        out[k] = `${parts[0]} ${maskSecret(parts[1])}`;
      } else {
        out[k] = maskSecret(v);
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

export type LogEntry = {
  timestamp?: string;
  phase: "BEFORE_API_HIT" | "AFTER_API_HIT" | "PROCESS_START" | "PROCESS_STEP" | "PROCESS_COMPLETE" | "PROCESS_ERROR";
  process: string;
  transactionId?: string;
  orderNumber?: string;
  method?: string;
  apiUrl?: string;
  requestHeaders?: Record<string, string>;
  requestPayload?: unknown;
  statusCode?: number;
  durationMs?: number;
  responseBody?: unknown;
  details?: unknown;
  error?: string;
};

export function writeTransactionLog(entry: LogEntry): void {
  const ts = entry.timestamp || new Date().toISOString();
  const fullEntry = { timestamp: ts, ...entry };

  const divider = "─".repeat(92);
  const lines: string[] = [
    divider,
    `[${ts}] [${fullEntry.phase}] [${fullEntry.process}]` +
      (fullEntry.transactionId ? ` [txId=${fullEntry.transactionId}]` : "") +
      (fullEntry.orderNumber ? ` [order=${fullEntry.orderNumber}]` : ""),
  ];

  if (fullEntry.apiUrl) {
    lines.push(`  API URL        : ${fullEntry.method || "GET"} ${fullEntry.apiUrl}`);
  }
  if (fullEntry.requestHeaders) {
    lines.push(`  Headers        : ${JSON.stringify(sanitizeHeaders(fullEntry.requestHeaders))}`);
  }
  if (fullEntry.requestPayload !== undefined) {
    lines.push(`  Request Body   : ${JSON.stringify(fullEntry.requestPayload)}`);
  }
  if (fullEntry.statusCode !== undefined) {
    lines.push(
      `  HTTP Status    : ${fullEntry.statusCode}` +
        (fullEntry.durationMs !== undefined ? ` (${fullEntry.durationMs} ms)` : "")
    );
  } else if (fullEntry.durationMs !== undefined) {
    lines.push(`  Duration       : ${fullEntry.durationMs} ms`);
  }
  if (fullEntry.responseBody !== undefined) {
    lines.push(`  Response Body  : ${JSON.stringify(fullEntry.responseBody)}`);
  }
  if (fullEntry.details !== undefined) {
    lines.push(`  Details        : ${JSON.stringify(fullEntry.details)}`);
  }
  if (fullEntry.error) {
    lines.push(`  ERROR          : ${fullEntry.error}`);
  }

  const formattedBlock = lines.join("\n") + "\n";

  // Always log to stdout/console as well for live server visibility
  console.log(formattedBlock.trim());

  try {
    ensureLogDir();
    fs.appendFileSync(TRANSACTION_LOG_PATH, formattedBlock, "utf8");
    fs.appendFileSync(TRANSACTION_JSONL_PATH, JSON.stringify(fullEntry) + "\n", "utf8");
  } catch (err) {
    console.warn("[logger] Could not write to log file:", err);
  }
}

/**
 * Helper wrapper that automatically logs `BEFORE_API_HIT` (with method, URL,
 * sanitized headers, and request payload), executes the `fetch`, and logs
 * `AFTER_API_HIT` (with HTTP status code, elapsed ms, and parsed response body).
 */
export async function loggedFetch(opts: {
  process: string;
  transactionId?: string;
  orderNumber?: string;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  bodyObj?: unknown;
}): Promise<{ res: Response; data: any; rawText: string; durationMs: number }> {
  const method = opts.method || "GET";
  const headers = opts.headers || {};
  const bodyString = opts.bodyObj !== undefined ? JSON.stringify(opts.bodyObj) : undefined;

  writeTransactionLog({
    phase: "BEFORE_API_HIT",
    process: opts.process,
    transactionId: opts.transactionId,
    orderNumber: opts.orderNumber,
    method,
    apiUrl: opts.url,
    requestHeaders: headers,
    requestPayload: opts.bodyObj,
  });

  const start = Date.now();
  try {
    const res = await fetch(opts.url, {
      method,
      headers,
      body: bodyString,
    });
    const durationMs = Date.now() - start;
    const rawText = await res.text().catch(() => "");
    let data: any = rawText;
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      // Keep rawText if non-JSON
    }

    writeTransactionLog({
      phase: "AFTER_API_HIT",
      process: opts.process,
      transactionId: opts.transactionId,
      orderNumber: opts.orderNumber,
      method,
      apiUrl: opts.url,
      statusCode: res.status,
      durationMs,
      responseBody: data,
    });

    return { res, data, rawText, durationMs };
  } catch (err) {
    const durationMs = Date.now() - start;
    const msg = err instanceof Error ? err.message : String(err);
    writeTransactionLog({
      phase: "PROCESS_ERROR",
      process: opts.process,
      transactionId: opts.transactionId,
      orderNumber: opts.orderNumber,
      method,
      apiUrl: opts.url,
      durationMs,
      error: msg,
    });
    throw err;
  }
}

