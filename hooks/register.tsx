import type {
  ElementTable,
  EngineInterface,
  Register,
  RenderChildren,
  SessionContextUsage,
  SessionRateLimit,
} from 'claude-code'

import type { ContextSlice, LimitReading, Stats, Usage } from '../types'
import {
  categoryLabel,
  dateLabel,
  hhmm,
  keepLast,
  limitLabel,
  markedSegments,
  pace,
  resetLabel,
  seconds,
  segments,
  spark,
  tokens,
  uptime,
} from './format'
import type { Segment } from './format'
import { careLine, placeholderSvg, portraitSvg } from './persona'
import { barSvg, smallText, tapeSvg } from './svg'
import { APPEARANCE_DEFAULTS, APPEARANCE_RANGES, readAppearance, sceneFor, lookFor, UNPAINTED } from './theme'
import type { Appearance } from './theme'
import type { Run } from './svg'

const EMPTY_STATS: Stats = {
  turns: 0,
  toolCalls: 0,
  failed: 0,
  lastTurnMs: null,
  toolsPerTurn: [],
  ctxHistory: [],
}

// Night-city HUD colors. Raw hex reads the same on every surface.
const C = {
  amber: '#e8a33d',
  cyan: '#38d6e6',
  pink: '#ff4f8b',
  red: '#ff4d6d',
  violet: '#9a6bd6',
  dim: '#7d8a99',
  text: '#d9e4ec',
  panel: '#0b0f14',
  well: '#10161d',
  // The empty part of a bar: a shade above the well, so it sinks into it.
  track: '#1c2731',
  mark: '#f2f6f8',
} as const

// The context bar's parts, in the order /context lists the biggest.
const SLICE_COLORS = [C.cyan, C.amber, C.pink] as const

const BAR_CELLS = 16

// The portrait's frame on the surfaces that draw Svg: as tall as the five
// rows beside it. The picture fills it, cropped at the sides, not stretched.
const PORTRAIT_W = 99
const PORTRAIT_H = 100

// The caution tape above and below the band, and the footer's small type.
// A thin rule of slanted dashes, far apart.
// Whole pixels: a fractional height lands on a different sub-pixel above and
// below the band, and the two strips then draw at different thicknesses.
const TAPE_GEOMETRY = { height: 2, stripe: 144, gap: 144, slant: 1.6 }
const TAPE_H = TAPE_GEOMETRY.height
const FOOTER_PX = 11
const TAPE = tapeSvg(C.amber, C.panel, TAPE_GEOMETRY)

// A bar's cells where the surface draws Svg: wide cells, a narrow gap.
const CELL_PX = 8
const CELL_GAP_PX = 1.4
const CELL_H_PX = 9

// Each column's share of the band's width. The limits sit at the right
// edge, the tools before them; the context takes whatever is left.
const SHARE = {
  three: { tools: '22%', limits: '31%' },
  two: { tools: undefined, limits: '40%' },
} as const

// The band never scrolls: its full form takes 9 rows (frame 2, sections 5,
// strip 2); with fewer it keeps the strip. Columns step aside on narrow
// widths rather than wrapping onto a second row.
const FULL_ROWS = 9
const WIDE_FOR_TOOLS = 96
const WIDE_FOR_LIMITS = 64

function toUsage(ctx: SessionContextUsage, limits: readonly SessionRateLimit[], slices: ContextSlice[]): Usage {
  return {
    percent: ctx.percent ?? null,
    tokens: ctx.tokens ?? null,
    window: ctx.window,
    slices,
    limits: limits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })),
  }
}

/** Reads the usage figures, with the window broken down by category. */
async function measure($: EngineInterface): Promise<Usage> {
  const u = await $.session.usage({ breakdown: 'summary' })
  const slices = (u.context.breakdown?.categories ?? [])
    .filter(c => c.kind === 'used' && c.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 3)
    .map(c => ({ name: c.name, tokens: c.tokens, color: c.color }))

  return toUsage(u.context, u.rateLimits, slices)
}

/** The portrait files under assets/, or null where there are none. */
async function loadPortrait($: EngineInterface) {
  let svg: string | null = null
  let png: string | null = null

  try {
    const jpeg = (await $.fs.read(`${$.plugin.root}/assets/portrait.jpg`, { as: 'bytes' })).base64
    svg = portraitSvg(jpeg, PORTRAIT_W, PORTRAIT_H)
  } catch {
    svg = null
  }
  try {
    png = (await $.fs.read(`${$.plugin.root}/assets/portrait.png`, { as: 'bytes' })).base64
  } catch {
    png = null
  }

  return { svg, png }
}

/** Everything a drawing reads, gathered once per render. */
type View = {
  T: ElementTable
  isTerminal: boolean
  isWorking: boolean
  name: string
  stats: Stats
  usage: Usage | null
  now: number
  startedAt: number
  portrait: { svg: string | null; png: string | null }
}

/**
 * The Svg element where the surface draws one (desktop, VS Code, mobile), or
 * undefined. Decided by the surface: the terminal's table can carry an Svg it
 * draws as an empty Box, so the key alone says nothing.
 */
function svgOf(v: View) {
  return !v.isTerminal && 'Svg' in v.T ? v.T.Svg : undefined
}

/** The terminal's Image element, or undefined elsewhere. */
function imageOf(v: View) {
  return v.isTerminal && 'Image' in v.T ? v.T.Image : undefined
}

function limitsOf(v: View): LimitReading[] {
  return (v.usage?.limits ?? []).slice(0, 2)
}

function statusLine(v: View): string {
  if (v.isWorking) {
    return '處理中…'
  }
  const five = limitsOf(v).find(l => l.kind === 'five_hour')

  if (five === undefined) {
    return '待命中。'
  }
  const reset = resetLabel(five.resetsAt, v.now)

  return `5小時額度已用 ${Math.round(five.percentUsed)}%${reset ? `,將於 ${reset} 重置` : ''}。`
}

// (Not `h` for the height: that name is the JSX factory.)
function portraitCell(v: View) {
  const { T } = v
  const Svg = svgOf(v)
  const Image = imageOf(v)
  const alt = v.name ? `${v.name} 頭像` : '頭像(空)'

  if (Svg !== undefined) {
    return <Svg source={v.portrait.svg ?? placeholderSvg(PORTRAIT_W, PORTRAIT_H)} alt={alt} width={PORTRAIT_W} height={PORTRAIT_H} />
  }
  if (Image !== undefined && v.portrait.png !== null) {
    return <Image key="portrait" source={{ png: v.portrait.png }} columns={10} rows={5} alt={alt} />
  }

  return <T.Box borderStyle="round" borderColor={C.pink} width={10} height={5} />
}

/**
 * A bar: exact cells in an Svg where the surface draws one, else one Text
 * with a run per color. Short and fixed either way, so it never wraps.
 */
function barText(v: View, parts: Segment[]) {
  const { Box, Text } = v.T
  const Svg = svgOf(v)

  if (Svg !== undefined) {
    const b = barSvg(parts, CELL_PX, CELL_GAP_PX, CELL_H_PX)

    return (
      <Box alignItems="center">
        <Svg source={b.source} alt={`${b.cells} 格`} width={b.width} height={b.height} />
      </Box>
    )
  }

  return (
    <Text>
      {parts.map(p => (
        <Text color={p.color}>{p.text}</Text>
      ))}
    </Text>
  )
}

/**
 * A row of a label and its figures. Each is a Text of its own, since a
 * surface may wrap a Text that holds others; only the right one truncates.
 */
function pair(v: View, left: string, leftColor: string, right: string, rightColor: string = C.dim, bold = true) {
  const { Box, Text } = v.T

  return (
    <Box flexDirection="row" gap={1} minWidth={0} overflow="hidden">
      <Text color={leftColor} bold={bold}>{left}</Text>
      <Box flexShrink={1} minWidth={0} overflow="hidden">
        <Text color={rightColor} wrap="truncate">{right}</Text>
      </Box>
    </Box>
  )
}

/** One section: a title row and four lines in a well; nothing wraps. */
function section(v: View, key: string, title: string, right: string, share: string | undefined, body: RenderChildren) {
  const { Box, Text } = v.T

  return (
    <Box
      key={key}
      flexDirection="column"
      width={share}
      flexGrow={share === undefined ? 1 : 0}
      flexShrink={1}
      minWidth={0}
      overflow="hidden"
      backgroundColor={v.isTerminal ? undefined : C.well}
      paddingX={1}
    >
      <Box flexDirection="row" justifyContent="space-between" gap={1}>
        <Text color={C.amber} bold>{title}</Text>
        <Text color={C.dim} wrap="truncate">{right}</Text>
      </Box>
      {body}
    </Box>
  )
}

function contextSection(v: View, share: string | undefined) {
  const { Box, Text } = v.T
  const u = v.usage
  const pct = u?.percent ?? null
  const slices = u?.slices ?? []
  const parts =
    u && slices.length > 0
      ? slices.map((sl, i) => ({ percent: (sl.tokens / u.window) * 100, color: SLICE_COLORS[i] ?? C.violet }))
      : [{ percent: pct ?? 0, color: C.cyan }]

  return section(
    v,
    'context',
    '上下文',
    u && u.tokens !== null ? `${tokens(u.tokens)} / ${tokens(u.window)}` : '',
    share,
    <>
      {pair(v, `已用 ${pct === null ? '--' : Math.round(pct)}%`, C.cyan, '', C.dim)}
      {barText(v, segments(parts, BAR_CELLS, C.track))}
      <Box flexDirection="row" gap={1} overflow="hidden">
        {slices.length === 0 ? (
          <Text color={C.dim} wrap="truncate">尚無分類</Text>
        ) : (
          slices.map((sl, i) => (
            <Box key={sl.name} flexDirection="row" flexShrink={0}>
              <Text color={SLICE_COLORS[i] ?? C.violet}>■</Text>
              <Text color={C.dim}>{`${categoryLabel(sl.name)} ${Math.round((sl.tokens / (u?.window ?? 1)) * 100)}%`}</Text>
            </Box>
          ))
        )}
      </Box>
      {pair(v, v.stats.ctxHistory.length > 0 ? spark(v.stats.ctxHistory, 100) : '·', C.cyan, `近 ${v.stats.ctxHistory.length} 回合`, C.dim, false)}
    </>,
  )
}

function limitsSection(v: View, share: string | undefined) {
  const { Text } = v.T
  const limits = limitsOf(v)

  return section(
    v,
    'limits',
    '方案額度',
    '▌已過時間',
    share,
    limits.length === 0 ? (
      <>
        <Text color={C.dim}>尚無讀數</Text>
        <Text color={C.dim}>(僅限訂閱方案)</Text>
        <Text> </Text>
        <Text> </Text>
      </>
    ) : (
      limits.flatMap(l => {
        const p = pace(l, v.now)
        const color = l.kind === 'five_hour' ? C.red : C.cyan
        const detail = [p.left && `剩${p.left}`, p.verdict].filter(Boolean).join(' · ')
        const bar =
          p.timeGone === null
            ? segments([{ percent: l.percentUsed, color }], BAR_CELLS, C.track)
            : markedSegments(l.percentUsed, color, p.timeGone, BAR_CELLS, C.track, C.mark)

        return [pair(v, `${limitLabel(l.kind)} ${Math.round(l.percentUsed)}%`, color, detail), barText(v, bar)]
      })
    ),
  )
}

function toolsSection(v: View, share: string | undefined) {
  const { Text } = v.T
  const perTurn = v.stats.toolsPerTurn
  const peak = Math.max(0, ...perTurn)
  const avg = perTurn.length ? Math.round(perTurn.reduce((a, b) => a + b, 0) / perTurn.length) : 0

  return section(
    v,
    'tools',
    '每回合工具',
    '',
    share,
    <>
      {pair(v, `峰值 ${peak}`, C.amber, `平均 ${avg}`, C.dim)}
      <Text color={peak > 0 ? C.violet : C.dim}>{peak > 0 ? spark(perTurn) : '尚無呼叫'}</Text>
      <Text color={C.dim}>{`近 ${perTurn.length} 回合`}</Text>
      <Text> </Text>
    </>,
  )
}

function stat(v: View, label: string, value: string, warn = false) {
  const { Box, Text } = v.T

  return (
    <Box key={label} flexDirection="row" gap={1} flexShrink={0}>
      <Text color={C.dim}>{label}</Text>
      <Text color={warn ? C.red : C.amber} bold>{value}</Text>
    </Box>
  )
}

/** The counters and the clock, as runs of text. */
function footerRuns(v: View): { left: Run[]; right: Run[] } {
  const s = v.stats
  const item = (label: string, value: string, warn = false): Run[] => [
    { text: `${label} `, color: C.dim },
    { text: value, color: warn ? C.red : C.amber, bold: true },
    { text: '   ', color: C.dim },
  ]

  return {
    left: [
      ...item('工具呼叫', String(s.toolCalls)),
      ...item('回合', String(s.turns)),
      ...item('上回合', s.lastTurnMs === null ? '--' : seconds(s.lastTurnMs)),
      ...item('失敗', String(s.failed), s.failed > 0),
      { text: '運行 ', color: C.dim },
      { text: v.startedAt ? uptime(v.now - v.startedAt) : '--:--', color: C.amber, bold: true },
    ],
    right: [
      { text: `${hhmm(v.now)} ${dateLabel(v.now)}  `, color: C.amber },
      { text: v.isWorking ? '● 運作中' : '○ 待命', color: v.isWorking ? C.cyan : C.amber, bold: true },
    ],
  }
}

/**
 * The counters and the clock: in small type where the surface draws Svg (a
 * Text's size cannot be set on this build), as Text in the terminal.
 */
function footer(v: View) {
  const { T } = v
  const { Box, Text } = T
  const Svg = svgOf(v)
  const runs = footerRuns(v)

  if (Svg !== undefined) {
    const left = smallText(runs.left, FOOTER_PX)
    const right = smallText(runs.right, FOOTER_PX)

    return (
      <Box flexDirection="row" justifyContent="space-between" gap={2} overflow="hidden">
        <Box flexShrink={1} minWidth={0} overflow="hidden">
          <Svg source={left.source} alt={left.alt} width={left.width} height={left.height} />
        </Box>
        <Box flexShrink={0}>
          <Svg source={right.source} alt={right.alt} width={right.width} height={right.height} />
        </Box>
      </Box>
    )
  }

  return (
    <Box flexDirection="row" justifyContent="space-between" gap={2} overflow="hidden">
      <Box flexDirection="row" flexShrink={1} minWidth={0} overflow="hidden">
        {runs.left.map(r => (
          <Text color={r.color} bold={r.bold === true}>{r.text}</Text>
        ))}
      </Box>
      <Box flexDirection="row" flexShrink={0}>
        {runs.right.map(r => (
          <Text color={r.color} bold={r.bold === true}>{r.text}</Text>
        ))}
      </Box>
    </Box>
  )
}

/** Her line on the left, the 5-hour status on the right, then the counters. */
function strip(v: View) {
  const { Box, Text } = v.T

  return (
    <Box flexDirection="column" backgroundColor={v.isTerminal ? undefined : C.well} paddingX={1} overflow="hidden">
      <Box flexDirection="row" justifyContent="space-between" gap={2} minWidth={0} overflow="hidden">
        <Box flexDirection="row" gap={1} flexShrink={1} minWidth={0} overflow="hidden">
          <Text color={C.pink} bold>{`◆ ${v.name}${v.name ? ' ' : ''}▸`}</Text>
          <Box flexShrink={1} minWidth={0} overflow="hidden">
            <Text color={C.text} wrap="truncate">{careLine(v.now)}</Text>
          </Box>
        </Box>
        <Box flexShrink={1} minWidth={0} overflow="hidden">
          <Text color={v.isWorking ? C.cyan : C.dim} wrap="truncate">{statusLine(v)}</Text>
        </Box>
      </Box>
      {footer(v)}
    </Box>
  )
}

/** The band: portrait and sections side by side, then the strip. */
function band(v: View, width: number, rows: number) {
  const { T } = v
  const { Box } = T
  const Svg = svgOf(v)
  const showLimits = width >= WIDE_FOR_LIMITS
  const showTools = width >= WIDE_FOR_TOOLS
  const share = showTools ? SHARE.three : SHARE.two
  const body = (
    <>
      {rows >= FULL_ROWS ? (
        <Box flexDirection="row" flexWrap="nowrap" gap={1} alignItems="stretch">
          <Box flexShrink={0} marginTop={1}>{portraitCell(v)}</Box>
          {contextSection(v, undefined)}
          {showTools ? toolsSection(v, share.tools) : null}
          {showLimits ? limitsSection(v, share.limits) : null}
        </Box>
      ) : null}
      {strip(v)}
    </>
  )

  // Where the surface draws Svg, caution tape above and below, in the
  // frame's amber; the terminal keeps a rounded border.
  if (Svg !== undefined) {
    return (
      <Box flexDirection="column" backgroundColor={C.panel} overflow="hidden">
        <Svg source={TAPE} alt="警戒線" height={TAPE_H} />
        <Box flexDirection="column" paddingX={1} gap={1} overflow="hidden">
          {body}
        </Box>
        <Svg source={TAPE} alt="警戒線" height={TAPE_H} />
      </Box>
    )
  }

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={C.amber} paddingX={1} overflow="hidden">
      {body}
    </Box>
  )
}

// Light presets drawn from the scene's own colors; the hex input stays for anything else.
const LIGHT_PRESETS = [
  { value: '#ffe3a8', label: '暖白' }, { value: '#e8a33d', label: '琥珀' },
  { value: '#2fb4c9', label: '青' }, { value: '#83b8ff', label: '冷藍' },
  { value: '#eb69b6', label: '粉' }, { value: '#9a6bd6', label: '紫' },
]

async function saveAppearance($: EngineInterface, state: { value: Appearance; status: string; saving: boolean }, candidate: Appearance) {
    if (state.saving) return
    state.saving = true
    try {
      const next = readAppearance(JSON.stringify(candidate))
      const result = await $.config.set({ key: 'icanfixthat-hud.appearance', value: JSON.stringify(next) })
      if ('deny' in result) { state.status = '未儲存：' + result.deny; return }
      state.value = readAppearance(result.value)
      const applied = await $.theme.set(lookFor(state.value))
      state.status = applied.isDrawn ? '已儲存並套用。' : '已儲存；此介面未繪製背景：' + applied.reason
    } catch (error) { state.status = '儲存失敗：' + String(error) }
    finally { state.saving = false; $.ui.invalidate('ui.render') }
  }

export const register: Register = (on, options) => {
  const appearanceState = { value: readAppearance(options['appearance']), status: '設定保存在本機；數值或色碼輸入後按 Enter。', saving: false }
  on('config.set', { key: 'icanfixthat-hud.appearance' }, async ($, e, next) => {
    const result = await next(e)
    if (!('deny' in result)) {
      appearanceState.value = readAppearance(result.value)
      await $.theme.set(lookFor(appearanceState.value))
      $.ui.invalidate('ui.render')
    }
    return result
  })
  on('ui.render', { component: 'Pane', requestId: 'interlinked-appearance' }, ($, e) => {
    const { Box, Text, Button, Input, Select } = $.ui.resolve(e)
    const toggles = [['city','顯示大樓'],['rain','玻璃雨滴'],['glass','背景／面板霧玻璃'],['light','右上光源'],['scan','掃描線'],['hud','顯示 HUD'],['motion','頂部邊框動畫']] as const
    const numbers = [['rainAmount','雨量 %'],['rainSpeed','雨速'],['glassStrength','霧化 px'],['lightStrength','亮度 %'],['scanSpeed','掃描週期 秒'],['hudWidth','HUD 寬度 %']] as const
    return <Box flexDirection="column">
      <Text color={C.amber}>夜城 · 外觀</Text>
      {toggles.map(([key,label]) => <Select key={key} label={label} value={String(appearanceState.value[key])} options={[{value:'true',label:'開啟'},{value:'false',label:'關閉'}]} onSelect={value => { void saveAppearance($, appearanceState, { ...appearanceState.value, [key]: value === 'true' }) }} />)}
      {numbers.map(([key,label]) => <Input key={key} label={`${label}（${APPEARANCE_RANGES[key].join('–')}）`} value={String(appearanceState.value[key])} submitLabel="套用" onSubmit={value => {
        if (!value.trim() || !Number.isFinite(Number(value))) { appearanceState.status='請輸入有效數值。'; $.ui.invalidate('ui.render'); return }
        void saveAppearance($, appearanceState, { ...appearanceState.value, [key]: Number(value) })
      }} />)}
      <Select key="lightPreset" label="光源顏色" value={appearanceState.value.lightColor.toLowerCase()} options={[
        ...LIGHT_PRESETS,
        ...(LIGHT_PRESETS.some(o => o.value === appearanceState.value.lightColor.toLowerCase()) ? [] : [{ value: appearanceState.value.lightColor.toLowerCase(), label: '自訂 ' + appearanceState.value.lightColor }]),
      ]} onSelect={value => { void saveAppearance($, appearanceState, { ...appearanceState.value, lightColor: value }) }} />
      <Input key="lightColor" label="自訂色碼 #RRGGBB" value={appearanceState.value.lightColor} submitLabel="套用" onSubmit={value => {
        if (!/^#[0-9a-f]{6}$/i.test(value)) { appearanceState.status='色碼格式為 #RRGGBB。'; $.ui.invalidate('ui.render'); return }
        void saveAppearance($, appearanceState, { ...appearanceState.value, lightColor:value })
      }} />
      <Text dimColor>{appearanceState.saving ? '儲存中…' : appearanceState.status}</Text>
      <Button key="appearance-reset" label="恢復預設" onPress={() => { void saveAppearance($, appearanceState, { ...APPEARANCE_DEFAULTS }) }} />
      <Button key="appearance-close" label="關閉" onPress={() => { void $.ui.close({id:'interlinked-appearance'}) }} />
    </Box>
  })
  const personaName = typeof options['persona_name'] === 'string' ? options['persona_name'].trim() : ''

  // What the band draws. The counters change synchronously, so parallel tool
  // calls never lose an increment, and each change asks for a redraw.
  // (This build has no $.state at run time, so a hot reload starts them over;
  // the usage figures come straight back from $.session.usage.)
  let stats: Stats = EMPTY_STATS
  let usage: Usage | null = null
  let turnTools = 0
  let startedAt = 0
  let now = 0
  let portrait: { svg: string | null; png: string | null } = { svg: null, png: null }

  on('session.start', async ($, e, next) => {
    const result = await next(e)

    // The look: colors and the night-city backdrop. A surface that draws no
    // themes says why; the HUD goes on either way.
    if (UNPAINTED !== undefined) {
      $.ui.toast(UNPAINTED)
    }
    try {
      const set = await $.theme.set(lookFor(appearanceState.value))
      if (!set.isDrawn) {
        $.ui.status(set.reason)
      }
    } catch {
      // ponytail: no theme where the host refuses one; the HUD still draws.
    }

    portrait = await loadPortrait($)
    const u = await $.session.usage()
    startedAt = u.startedAt
    usage = toUsage(u.context, u.rateLimits, [])
    now = await $.clock.now()
    $.ui.invalidate('ui.render')

    // The breakdown is a local estimate (no request), so the legend has
    // figures before the first turn ends.
    usage = await measure($)
    $.ui.invalidate('ui.render')

    // The clock and uptime. A hot reload cancels the old timer.
    $.clock.every(30_000, () => {
      void $.clock.now().then(ms => {
        now = ms
        $.ui.invalidate('ui.render')
      })
    })

    return result
  })

  // Live figures between turns: the context fill and the limit windows.
  on('session.measure', ($, e, next) => {
    usage = toUsage(e.context, e.rateLimits, usage?.slices ?? [])
    $.ui.invalidate('ui.render')

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    turnTools += 1
    const r = await next(e)
    const failed = r.isError === true || ('deny' in r && r.deny !== undefined)
    stats = { ...stats, toolCalls: stats.toolCalls + 1, failed: stats.failed + (failed ? 1 : 0) }
    $.ui.invalidate('ui.render')

    return r
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)

    // A subagent's turn is not one of the session's turns.
    if (e.agentId !== undefined) {
      return result
    }
    const called = turnTools
    turnTools = 0
    stats = { ...stats, turns: stats.turns + 1, lastTurnMs: e.durationMs, toolsPerTurn: keepLast(stats.toolsPerTurn, called, 10) }

    const u = await measure($)
    usage = u
    if (u.percent !== null) {
      stats = { ...stats, ctxHistory: keepLast(stats.ctxHistory, u.percent, 8) }
    }
    now = await $.clock.now()
    $.ui.invalidate('ui.render')

    return result
  })

  // The backdrop the look names: the lattice and the scan, behind the chat.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={sceneFor(appearanceState.value)} alt="遠方大樓、格線與霧玻璃雨景" isInteractive />
  })

  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }
    const v: View = {
      T: $.ui.resolve(e),
      isTerminal: e.surface === 'terminal',
      isWorking: e.props.isWorking,
      name: personaName,
      stats,
      usage,
      now: now || Date.now(),
      startedAt,
      portrait,
    }

    const { Box, Button } = v.T
    return <Box flexDirection="column">
      <Box justifyContent="flex-end"><Button key="appearance-open" label="◈ 外觀" onPress={() => { void $.ui.open({id:'interlinked-appearance',title:'夜城外觀',focus:true,closeOnEscape:true,rows:24,columns:52}) }} /></Box>
      {appearanceState.value.hud ? band(v, Math.floor(e.props.bodyColumns * appearanceState.value.hudWidth / 100), Math.max(1, e.props.maxRows - 1)) : null}
    </Box>
  })
}
