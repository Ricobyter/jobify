import { inngest } from "@/services/inngest/client"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const raw = await req.text()

  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  const payload = JSON.parse(raw)
  const eventType = payload.type as string

  const eventData = { data: payload.data, raw, headers }

  const eventMap: Record<string, string> = {
    "user.created": "clerk/user.created",
    "user.updated": "clerk/user.updated",
    "user.deleted": "clerk/user.deleted",
    "organization.created": "clerk/organization.created",
    "organization.updated": "clerk/organization.updated",
    "organization.deleted": "clerk/organization.deleted",
    "organizationMembership.created": "clerk/organizationMembership.created",
    "organizationMembership.deleted": "clerk/organizationMembership.deleted",
  }

  const inngestEvent = eventMap[eventType]
  if (inngestEvent == null) {
    return NextResponse.json({ received: true })
  }

  await inngest.send({
    name: inngestEvent as Parameters<typeof inngest.send>[0]["name"],
    data: eventData,
  })

  return NextResponse.json({ received: true })
}
