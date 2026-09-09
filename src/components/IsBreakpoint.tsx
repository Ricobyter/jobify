"use client"

import { ReactNode, useSyncExternalStore } from "react"

export function IsBreakpoint({
  breakpoint,
  children,
  otherwise,
}: {
  breakpoint: string
  children: ReactNode
  otherwise?: ReactNode
}) {
  const IsBreakpoint = useIsBreakpoint(breakpoint)
  return IsBreakpoint ? children : otherwise
}

function useIsBreakpoint(breakpoint: string) {
  return useSyncExternalStore(
    onStoreChange => {
      const media = window.matchMedia(`(${breakpoint})`)
      media.addEventListener("change", onStoreChange)
      return () => media.removeEventListener("change", onStoreChange)
    },
    () => window.matchMedia(`(${breakpoint})`).matches,
    () => false
  )
}
