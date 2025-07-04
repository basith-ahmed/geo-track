import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();
const REDIRECT_URL = "https://basithahmed.vercel.app";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const geo = await fetch(`https://ipapi.co/${ip}/json/`).then((res) =>
    res.json()
  );

  await prisma.iPLog.create({
    data: {
      ip,
      city: geo.city || "",
      region: geo.region || "",
      country: geo.country_name || "",
      latitude: parseFloat(geo.latitude) || 0,
      longitude: parseFloat(geo.longitude) || 0,
    },
  });

  return NextResponse.redirect(REDIRECT_URL);
}
