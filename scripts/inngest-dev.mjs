import { spawn } from "node:child_process"

const rawBaseUrl = process.env.INNGEST_BASE_URL ?? "http://localhost:3000"
const baseUrl = rawBaseUrl.replace(/\/+$/, "")
const endpointUrl = `${baseUrl}/api/inngest`

console.log(`[inngest] Using serve URL: ${endpointUrl}`)

const child = spawn(`npx inngest-cli dev -u "${endpointUrl}"`, {
  stdio: "inherit",
  shell: true,
})

child.on("exit", code => {
  process.exit(code ?? 1)
})
