/**
 * Fetch a user-supplied URL without letting the server reach private
 * networks. Every DNS answer is checked at connect time (not just before
 * the request), redirects are followed by hand with the same check, and
 * the body is capped.
 */
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  headers?: Record<string, string>;
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  text: string;
  finalUrl: string;
  contentType: string;
}

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);

function ipv4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
}

function inCidr4(ip: string, cidr: string): boolean {
  const [base, bits] = cidr.split("/");
  const mask = bits === "0" ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

const PRIVATE_V4 = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "224.0.0.0/4",
  "240.0.0.0/4",
];

/** True when the address is loopback, private, link-local, or otherwise not public. */
export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return PRIVATE_V4.some((cidr) => inCidr4(ip, cidr));
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::" || lower === "::1") return true;
    if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) return true; // fe80::/10
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // fc00::/7
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }
  return true;
}

export function assertSafeUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new UnsafeUrlError("Not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are allowed");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with credentials are not allowed");
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new UnsafeUrlError("That host is not allowed");
  }
  const literal = host.startsWith("[") ? host.slice(1, -1) : host;
  if (net.isIP(literal) && isPrivateAddress(literal)) {
    throw new UnsafeUrlError("Private network addresses are not allowed");
  }
  return url;
}

type LookupCallback = (err: NodeJS.ErrnoException | null, address: string, family: number) => void;

/** DNS lookup that refuses to hand back a private address. */
function guardedLookup(hostname: string, options: dns.LookupOptions, callback: LookupCallback): void {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err, "", 4);
    const list = (Array.isArray(addresses) ? addresses : [addresses]) as dns.LookupAddress[];
    const safe = list.filter((a) => !isPrivateAddress(a.address));
    if (safe.length === 0 || safe.length !== list.length) {
      const e: NodeJS.ErrnoException = new Error("Host resolves to a private address");
      e.code = "EUNSAFE";
      return callback(e, "", 4);
    }
    callback(null, safe[0].address, safe[0].family);
  });
}

function requestOnce(url: URL, opts: Required<Omit<SafeFetchOptions, "headers">> & { headers: Record<string, string> }) {
  return new Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }>((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        headers: opts.headers,
        lookup: guardedLookup as unknown as net.LookupFunction,
        timeout: opts.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let received = 0;
        res.on("data", (chunk: Buffer) => {
          received += chunk.length;
          if (received > opts.maxBytes) {
            res.destroy();
            resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") });
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") }));
        res.on("error", reject);
      }
    );
    req.on("timeout", () => req.destroy(new Error("Request timed out")));
    req.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EUNSAFE") reject(new UnsafeUrlError("Host resolves to a private address"));
      else reject(err);
    });
    req.end();
  });
}

export async function safeFetch(input: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const opts = {
    timeoutMs: options.timeoutMs ?? 8000,
    maxBytes: options.maxBytes ?? 2_000_000,
    maxRedirects: options.maxRedirects ?? 3,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; InterviewTracker/1.0)",
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
      ...(options.headers ?? {}),
    },
  };

  let url = assertSafeUrl(input);
  for (let hop = 0; hop <= opts.maxRedirects; hop++) {
    const res = await requestOnce(url, opts);
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      if (hop === opts.maxRedirects) throw new UnsafeUrlError("Too many redirects");
      url = assertSafeUrl(new URL(res.headers.location, url).toString());
      continue;
    }
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      text: res.body,
      finalUrl: url.toString(),
      contentType: String(res.headers["content-type"] ?? ""),
    };
  }
  throw new UnsafeUrlError("Too many redirects");
}
