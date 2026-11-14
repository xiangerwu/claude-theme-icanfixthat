// Pure helpers: no `$`, so the tests can call them directly. Labels are in
// Traditional Chinese, as the HUD shows them.
import type { LimitReading } from '../types'

const WINDOW_MS: Record<string, number> = {
  five_hour: 5 * 60 * 60 * 1000,
  seven_day: 7 * 24 * 60 * 60 * 1000,
}

const LABEL: Record<string, string> = {
  five_hour: '5小時',
  seven_day: '每週',
  spend_limit: '花費',
}

// /context's category names, as the legend shows them.
const CATEGORY: Record<string, string> = {
  'messages': '訊息',
  'system prompt': '系統提示',
  'system tools': '系統工具',
  'mcp tools': 'MCP工具',
  'custom agents': '自訂代理',
  'memory files': '記憶檔',
  'skills': '技能',
  'slash commands': '指令',
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** One bar cell: a left-half block, so each cell stands apart from the next. */
export const CELL = '▌'

/** One run of same-colored cells in a bar. */
export type Segment = { text: string; color: string }

/**
 * A bar of `cells` cells: each part's share in its own color, the rest
 * as `track`, a color close to the panel so the empty part sinks into it.
 */
export function segments(parts: readonly { percent: number; color: string }[], cells: number, track: string): Segment[] {
  const out: Segment[] = []
  let used = 0

  for (const part of parts) {
    const n = Math.min(cells - used, Math.round((clamp(part.percent, 0, 100) / 100) * cells))

    if (n > 0) {
      out.push({ text: CELL.repeat(n), color: part.color })
      used += n
    }
  }
  if (used < cells) {
    out.push({ text: CELL.repeat(cells - used), color: track })
  }

  return out
}

/** A bar with the cell `fraction` of the way along drawn in `markColor`. */
export function markedSegments(
  percent: number,
  color: string,
  fraction: number,
  cells: number,
  track: string,
  markColor: string,
): Segment[] {
  const filled = Math.round((clamp(percent, 0, 100) / 100) * cells)
  const at = clamp(Math.round(fraction * cells) - 1, 0, cells - 1)
  const out: Segment[] = []

  for (let i = 0; i < cells; i++) {
    const c = i === at ? markColor : i < filled ? color : track
    const last = out[out.length - 1]

    if (last !== undefined && last.color === c) {
      last.text += CELL
    } else {
      out.push({ text: CELL, color: c })
    }
  }

  return out
}

/** A sparkline of `values`, scaled to `max` (or their own peak). */
export function spark(values: readonly number[], max?: number): string {
  const ticks = '▁▂▃▄▅▆▇█'
  const top = max ?? Math.max(1, ...values)

  return values
    .map(v => ticks[clamp(Math.round((v / top) * (ticks.length - 1)), 0, ticks.length - 1)])
    .join('')
}

export function limitLabel(kind: string): string {
  return LABEL[kind] ?? kind.replace(/_/g, ' ')
}

export function categoryLabel(name: string): string {
  return CATEGORY[name.toLowerCase()] ?? name
}

/** How far through its window a limit is, and whether use runs ahead of time. */
export function pace(reading: LimitReading, now: number) {
  const span = WINDOW_MS[reading.kind]
  const resets = reading.resetsAt === undefined ? NaN : Date.parse(reading.resetsAt)

  if (span === undefined || Number.isNaN(resets)) {
    return { timeGone: null, left: null, verdict: null } as const
  }
  const leftMs = Math.max(0, resets - now)
  const timeGone = clamp(1 - leftMs / span, 0, 1)
  const verdict = reading.percentUsed / 100 > timeGone ? '用量超前' : '節奏正常'

  return { timeGone, left: countdown(leftMs), verdict } as const
}

/** "2時10分", "3天5時", "45分". */
export function countdown(ms: number): string {
  const m = Math.floor(ms / 60000)
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)

  if (d > 0) {
    return `${d}天${h}時`
  }

  return h > 0 ? `${h}時${m % 60}分` : `${m % 60}分`
}

const pad = (n: number) => String(n).padStart(2, '0')
const DAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

/** "22:23" */
export function hhmm(ms: number): string {
  const d = new Date(ms)

  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** "11月13日 週五" */
export function dateLabel(ms: number): string {
  const d = new Date(ms)

  return `${d.getMonth() + 1}月${d.getDate()}日 ${DAYS[d.getDay()]}`
}

/** "週二 04:00" for a reset more than a day off, else "00:30". */
export function resetLabel(iso: string | undefined, now: number): string | null {
  const at = iso === undefined ? NaN : Date.parse(iso)

  if (Number.isNaN(at)) {
    return null
  }

  return at - now > 24 * 60 * 60 * 1000 ? `${DAYS[new Date(at).getDay()]} ${hhmm(at)}` : hhmm(at)
}

/** Uptime as "HH:MM". */
export function uptime(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60000))

  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
}

/** A turn's length: "3秒", "1分20秒". */
export function seconds(ms: number): string {
  const s = Math.round(ms / 1000)

  return s < 60 ? `${s}秒` : `${Math.floor(s / 60)}分${s % 60}秒`
}

/** "109K", "1M", "850". */
export function tokens(n: number): string {
  if (n >= 1_000_000) {
    return `${+(n / 1_000_000).toFixed(1)}M`
  }

  return n >= 1000 ? `${Math.round(n / 1000)}K` : String(n)
}

/** Keeps the last `n` of a list with `value` appended. */
export function keepLast(list: readonly number[], value: number, n: number): number[] {
  return [...list, value].slice(-n)
}
