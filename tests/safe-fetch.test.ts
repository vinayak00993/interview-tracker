import { describe, it, expect } from "vitest";
import { assertSafeUrl, isPrivateAddress, UnsafeUrlError } from "@/lib/safe-fetch";

describe("isPrivateAddress", () => {
  it("flags loopback, private, link-local and metadata ranges", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "::1", "fe80::1", "fd00::1", "::ffff:10.0.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });
  it("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "172.32.0.1", "93.184.216.34", "2606:4700::1111"]) {
      expect(isPrivateAddress(ip), ip).toBe(false);
    }
  });
});

describe("assertSafeUrl", () => {
  it("rejects non-http schemes, credentials, and local hosts", () => {
    for (const url of ["ftp://example.com", "file:///etc/passwd", "http://user:pw@example.com", "http://localhost:3000", "http://foo.localhost", "http://metadata.google.internal", "http://127.0.0.1", "http://[::1]/", "http://169.254.169.254/latest", "not a url"]) {
      expect(() => assertSafeUrl(url), url).toThrow(UnsafeUrlError);
    }
  });
  it("accepts ordinary public URLs", () => {
    expect(assertSafeUrl("https://boards.greenhouse.io/acme/jobs/1").hostname).toBe("boards.greenhouse.io");
  });
});
