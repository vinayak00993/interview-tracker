import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Tesseract from "tesseract.js";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const files = formData.getAll("screenshots") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No screenshots provided" }, { status: 400 });
    }

    // OCR each image and combine text
    const textParts: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

      const { data } = await Tesseract.recognize(base64, "eng", {
        logger: () => {}, // suppress progress logs
      });
      textParts.push(data.text);
    }

    const fullText = textParts.join("\n\n");

    // Parse the OCR'd text to extract job details
    const result: Record<string, any> = {};

    // Company — look for "at Company" or "Company is hiring" patterns
    const companyPatterns = [
      /(?:at|@)\s+([A-Z][A-Za-z0-9\s&.]+?)(?:\s*[-–—|,]|\s+is\b|\s+we\b)/,
      /^([A-Z][A-Za-z0-9\s&.]{2,30})\s*(?:is hiring|careers|jobs)/im,
      /company[:\s]+([A-Z][A-Za-z0-9\s&.]+?)(?:\n|$)/im,
    ];
    for (const pattern of companyPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.company = match[1].trim();
        break;
      }
    }

    // Role/title — look for common job title patterns
    const rolePatterns = [
      /(?:job title|position|role)[:\s]+(.+?)(?:\n|$)/i,
      /(?:^|\n)\s*((?:Senior |Staff |Lead |Principal |Director |Head |VP |Manager )?(?:Software|Product|Data|Business Development|BD|Strategic|Account|Sales|Marketing|Design|Engineering|Growth|Operations|Partner|Partnerships?)\s+(?:Engineer|Manager|Director|Lead|Analyst|Scientist|Designer|Strategist|Executive|Associate|Coordinator|Specialist|Advisor|Consultant|Representative)[^\n]{0,30})(?:\n|$)/im,
      /(?:^|\n)\s*([A-Z][A-Za-z\s,]+(?:Engineer|Manager|Director|Lead|Analyst|Scientist|Designer|Developer|Architect|Strategist))\s*(?:\n|$)/m,
    ];
    for (const pattern of rolePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.role = match[1].trim().substring(0, 100);
        break;
      }
    }

    // Location
    const locPatterns = [
      /(?:location|office|based in|located in)[:\s]+([A-Za-z\s]+,\s*[A-Z]{2}(?:\s*,\s*[A-Za-z\s]+)?)/i,
      /(?:^|\n)\s*((?:San Francisco|New York|Los Angeles|Chicago|Austin|Seattle|Boston|Denver|Miami|Atlanta|Portland|Washington|London|Singapore|Tokyo|Berlin|Toronto|Vancouver|Remote)[,\s]+[A-Z]{0,2}[A-Za-z\s]*)/m,
    ];
    for (const pattern of locPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.location = match[1].trim();
        break;
      }
    }

    // Remote
    if (/\b(?:remote|work from home|wfh|distributed|anywhere)\b/i.test(fullText)) {
      result.remote = true;
    }

    // Compensation
    const salaryPatterns = [
      /\$\s*([\d,]+)\s*[kK]?\s*[-–—to]+\s*\$?\s*([\d,]+)\s*[kK]?/,
      /(?:salary|compensation|pay|base)[:\s]*\$?\s*([\d,]+)\s*[kK]?\s*[-–—to]+\s*\$?\s*([\d,]+)\s*[kK]?/i,
      /([\d]{2,3})[kK]\s*[-–—to]+\s*([\d]{2,3})[kK]/,
    ];
    for (const pattern of salaryPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        let min = parseInt(match[1].replace(/,/g, ""), 10);
        let max = parseInt(match[2].replace(/,/g, ""), 10);
        if (min > 1000) min = Math.round(min / 1000);
        if (max > 1000) max = Math.round(max / 1000);
        if (min > 0 && max > 0) {
          result.compMin = min;
          result.compMax = max;
        }
        break;
      }
    }

    // Clean up
    Object.keys(result).forEach((k) => {
      if (result[k] === undefined || result[k] === "") delete result[k];
    });

    return NextResponse.json({ ...result, rawText: fullText.substring(0, 3000) });
  } catch (error) {
    console.error("POST /api/parse-screenshots error:", error);
    return NextResponse.json({ error: "Failed to process screenshots" }, { status: 500 });
  }
}
