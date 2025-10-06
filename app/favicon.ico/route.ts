export function GET() {
  // Return no-content to satisfy browsers requesting /favicon.ico without 404s
  return new Response(null, {
    status: 204,
    headers: { "content-type": "image/x-icon" },
  })
}
