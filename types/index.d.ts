/** One rate-limit window as the last API response reported it. */
export type LimitReading = { kind: string; percentUsed: number; resetsAt?: string }

/** One "used" category of the context window, as /context names it. */
export type ContextSlice = { name: string; tokens: number; color: string }

/** The figures the CONTEXT and PLAN LIMITS columns draw. */
export type Usage = {
  percent: number | null
  tokens: number | null
  window: number
  slices: ContextSlice[]
  limits: LimitReading[]
}

/** The counters the footer row and the TOOL CALLS column draw. */
export type Stats = {
  turns: number
  toolCalls: number
  failed: number
  lastTurnMs: number | null
  /** Tool calls in each of the last 10 main turns, oldest first. */
  toolsPerTurn: number[]
  /** Context fill (percent) after each of the last 8 main turns, oldest first. */
  ctxHistory: number[]
}
