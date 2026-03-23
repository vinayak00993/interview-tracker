import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

    // Fetch the page
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${res.status}` }, { status: 400 });
    }

    const html = await res.text();

    // Strip HTML tags to get raw text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Try to extract structured data from JSON-LD
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    let structured: any = null;
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        // Could be a single object or array
        const job = Array.isArray(jsonLd) ? jsonLd.find((j: any) => j["@type"] === "JobPosting") : (jsonLd["@type"] === "JobPosting" ? jsonLd : null);
        if (job) {
          structured = {
            role: job.title,
            company: job.hiringOrganization?.name,
            location: job.jobLocation?.address?.addressLocality
              ? `${job.jobLocation.address.addressLocality}${job.jobLocation.address.addressRegion ? ", " + job.jobLocation.address.addressRegion : ""}`
              : undefined,
            remote: job.jobLocationType === "TELECOMMUTE" || /remote/i.test(job.jobLocationType || ""),
            compMin: job.baseSalary?.value?.minValue ? Math.round(job.baseSalary.value.minValue / 1000) : undefined,
            compMax: job.baseSalary?.value?.maxValue ? Math.round(job.baseSalary.value.maxValue / 1000) : undefined,
          };
        }
      } catch {}
    }

    // Fallback: heuristic extraction from text
    const result: Record<string, any> = { jdLink: url };

    // Company name from common patterns
    if (structured?.company) {
      result.company = structured.company;
    } else {
      // Try og:site_name or og:title
      const ogSite = html.match(/property="og:site_name"\s+content="([^"]+)"/i);
      if (ogSite) result.company = ogSite[1];
    }

    // Role/title
    if (structured?.role) {
      result.role = structured.role;
    } else {
      const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i);
      const titleTag = html.match(/<title>([^<]+)<\/title>/i);
      const rawTitle = ogTitle?.[1] || titleTag?.[1] || "";
      // Clean common patterns like "Role - Company" or "Role | Company"
      const titleParts = rawTitle.split(/\s*[-|–—]\s*/);
      if (titleParts.length > 0 && !result.role) {
        result.role = titleParts[0].trim();
        if (!result.company && titleParts.length > 1) {
          result.company = titleParts[titleParts.length - 1].replace(/careers|jobs|hiring/gi, "").trim();
        }
      }
    }

    // Location
    if (structured?.location) {
      result.location = structured.location;
    } else {
      // Look for common location patterns
      const locMatch = text.match(/(?:location|office|based in)[:\s]+([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/i);
      if (locMatch) result.location = locMatch[1].trim();
    }

    // Remote
    if (structured?.remote) {
      result.remote = true;
    } else if (/\bremote\b/i.test(text.substring(0, 2000))) {
      result.remote = true;
    }

    // Comp
    if (structured?.compMin) result.compMin = structured.compMin;
    if (structured?.compMax) result.compMax = structured.compMax;
    if (!result.compMin && !result.compMax) {
      // Try to find salary patterns like $150,000 - $200,000 or $150K - $200K
      const salaryMatch = text.match(/\$\s*([\d,]+)\s*[kK]?\s*[-–—to]+\s*\$?\s*([\d,]+)\s*[kK]?/);
      if (salaryMatch) {
        let min = parseInt(salaryMatch[1].replace(/,/g, ""), 10);
        let max = parseInt(salaryMatch[2].replace(/,/g, ""), 10);
        // Normalize to $K
        if (min > 1000) min = Math.round(min / 1000);
        if (max > 1000) max = Math.round(max / 1000);
        if (min > 0 && max > 0) {
          result.compMin = min;
          result.compMax = max;
        }
      }
    }

    // Clean up undefined values
    Object.keys(result).forEach((k) => {
      if (result[k] === undefined || result[k] === "") delete result[k];
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/parse-jd error:", error);
    return NextResponse.json({ error: "Failed to parse job description" }, { status: 500 });
  }
}
