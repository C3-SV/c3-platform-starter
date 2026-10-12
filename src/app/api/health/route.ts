import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    project: "c3-platform",
    status: "scaffold",
    // No implica que Firebase esté conectado ni que el MVP esté operativo.
    firebaseConnected: false,
  });
}
