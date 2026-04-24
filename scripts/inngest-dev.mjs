import { spawn } from "node:child_process"

const rawBaseUrl = process.env.SERVER_URL ?? "http://localhost:3000"
const baseUrl = rawBaseUrl.replace(/\/+$/, "")
const endpointUrl = `${baseUrl}/api/inngest`

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["inngest-cli", "dev", "-u", endpointUrl],
  { stdio: "inherit" }
)

child.on("exit", code => {
  process.exit(code ?? 1)
})
