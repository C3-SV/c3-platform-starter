import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    project: "c3-platform",
    status: "ok",
  });
}
