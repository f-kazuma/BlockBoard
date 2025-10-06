import { NextResponse } from "next/server"

export function GET(request: Request) {
  // Redirect favicon.ico requests to an existing SVG logo
  const url = new URL("/placeholder-logo.svg", request.url)
  return NextResponse.redirect(url)
}

