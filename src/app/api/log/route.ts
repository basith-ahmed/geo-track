import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const REDIRECT_URL = "https://basithahmed.vercel.app";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  type GeoType = {
    city?: string;
    region?: string;
    country_name?: string;
    latitude?: string;
    longitude?: string;
  };
  let geo: Partial<GeoType> = {};

  // Helper to check if geo is complete
  function isGeoComplete(g: Partial<GeoType>) {
    return !!(g.city && g.region && g.country_name && g.latitude && g.longitude);
  }

  // ipapi.co first
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (response.ok) {
      geo = await response.json();
    } else {
      console.error(`Geo lookup failed for IP ${ip}: HTTP ${response.status}`);
    }
  } catch (error) {
    console.error(`Geo lookup error for IP ${ip}:`, error);
  }

  // Fallback to ip-api.com if incomplete
  if (!isGeoComplete(geo)) {
    try {
      const response = await fetch(`http://ip-api.com/json/${ip}`);
      if (response.ok) {
        const fallback = await response.json();
        geo = {
          city: fallback.city,
          region: fallback.regionName,
          country_name: fallback.country,
          latitude: fallback.lat ? fallback.lat.toString() : undefined,
          longitude: fallback.lon ? fallback.lon.toString() : undefined,
        };
      } else {
        console.error(`Fallback geo lookup failed for IP ${ip}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`Fallback geo lookup error for IP ${ip}:`, error);
    }
  }

  await prisma.iPLog.create({
    data: {
      ip,
      city: geo.city || "",
      region: geo.region || "",
      country: geo.country_name || "",
      latitude: geo.latitude ? parseFloat(geo.latitude) : 0,
      longitude: geo.longitude ? parseFloat(geo.longitude) : 0,
    },
  });

  return NextResponse.redirect(REDIRECT_URL);
}
