import { env } from "@/data/env/server"
import { inngest } from "@/services/inngest/client"
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"

type ClerkEventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "organization.created"
  | "organization.updated"
  | "organization.deleted"
  | "organizationMembership.created"
  | "organizationMembership.deleted"

const eventMap = {
  "user.created": "clerk/user.created",
  "user.updated": "clerk/user.updated",
  "user.deleted": "clerk/user.deleted",
  "organization.created": "clerk/organization.created",
  "organization.updated": "clerk/organization.updated",
  "organization.deleted": "clerk/organization.deleted",
  "organizationMembership.created": "clerk/organizationMembership.created",
  "organizationMembership.deleted": "clerk/organizationMembership.deleted",
} as const satisfies Record<ClerkEventType, string>

export async function POST(req: NextRequest) {
  const raw = await req.text()

  const headers: Record<string, string> = {}
  req.headers.forEach((value, key) => {
    headers[key] = value
  })

  try {
    new Webhook(env.CLERK_WEBHOOK_SECRET).verify(raw, headers)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const payload = JSON.parse(raw)
  const eventType = payload.type as string

  if (!(eventType in eventMap)) {
    return NextResponse.json({ received: true })
  }

  const inngestEventName =
    eventMap[eventType as ClerkEventType]

  await inngest.send({
    name: inngestEventName,
    data: { data: payload.data, raw, headers },
  } as Parameters<typeof inngest.send>[0])

  return NextResponse.json({ received: true })
}
