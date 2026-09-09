import { ReactNode } from "react"

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background dark:bg-[#0B0B0B]">{children}</div>
  )
}
