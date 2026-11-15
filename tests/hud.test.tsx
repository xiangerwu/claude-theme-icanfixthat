import type { On } from 'claude-code'
import { describe, expect, mock, test } from 'claude-code/testing'

import {
  countdown,
  dateLabel,
  keepLast,
  markedSegments,
  pace,
  seconds,
  segments,
  spark,
  tokens,
  uptime,
} from '../hooks/format'
import { CARE_EVERY_MS, CARE_LINES, careLine } from '../hooks/persona'
import { barSvg, smallText, tapeSvg, textWidth } from '../hooks/svg'
import { LOOK, SCENE, UNPAINTED, APPEARANCE_DEFAULTS, readAppearance, sceneFor } from '../hooks/theme'

test('the Interlinked theme builds without a Desktop painting blocker', async () => {
  expect(UNPAINTED).toBe(undefined)
  expect(LOOK.backdrop?.scene).toBe('interlinked')
  expect(SCENE).toMatch(/^<svg /)
})

const HOUR = 60 * 60 * 1000
const NOW = Date.UTC(2026, 10, 13, 14, 23)

const BAND = {
  plugin: 'icanfixthat-hud',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 12,
    bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 12 },
    view: {},
  },
} as const

const USAGE = {
  startedAt: NOW - 14 * 60 * 1000,
  context: { window: 1_000_000, tokens: 109_000, percent: 11 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 96, resetsAt: new Date(NOW + 2 * HOUR + 10 * 60 * 1000).toISOString() },
    { kind: 'seven_day', percentUsed: 38, resetsAt: new Date(NOW + 77 * HOUR).toISOString() },
  ],
}

/** The alt words of every Svg a drawing holds: tape, footer and portrait. */
async function svgAlts(ui: { findAll: (q: { type: string }) => Promise<{ props: Record<string, unknown> }[]> }) {
  return (await ui.findAll({ type: 'Svg' })).map(el => String(el.props['alt']))
}

/** Stands for the engine at session start. */
function boot(on: On) {
  mock.clock(on, { now: NOW })
  on('session.usage', () => ({ value: USAGE }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
}

describe('format helpers', () => {
  test('bars: colored parts, a dark track, a marked cell', async () => {
    expect(segments([{ percent: 25, color: 'a' }, { percent: 25, color: 'b' }], 8, 't')).toEqual([
      { text: '▌▌', color: 'a' },
      { text: '▌▌', color: 'b' },
      { text: '▌▌▌▌', color: 't' },
    ])
    expect(segments([{ percent: 140, color: 'a' }], 4, 't')).toEqual([{ text: '▌▌▌▌', color: 'a' }])
    expect(markedSegments(50, 'a', 0.25, 8, 't', 'm')).toEqual([
      { text: '▌', color: 'a' },
      { text: '▌', color: 'm' },
      { text: '▌▌', color: 'a' },
      { text: '▌▌▌▌', color: 't' },
    ])
    expect(spark([0, 4, 8], 8)).toBe('▁▅█')
    expect(keepLast([1, 2, 3], 4, 3)).toEqual([2, 3, 4])
  })

  test('durations, dates and token counts, in Chinese', async () => {
    expect(countdown(2 * HOUR + 10 * 60 * 1000)).toBe('2時10分')
    expect(countdown(77 * HOUR)).toBe('3天5時')
    expect(seconds(3000)).toBe('3秒')
    expect(seconds(80_000)).toBe('1分20秒')
    expect(uptime(14 * 60 * 1000)).toBe('00:14')
    expect(dateLabel(new Date(2026, 10, 13, 12).getTime())).toBe('11月13日 週五')
    expect(tokens(109_000)).toBe('109K')
    expect(tokens(1_000_000)).toBe('1M')
  })

  test('svg: tape keeps its stripes unscaled; small type measures its words', async () => {
    const tape = tapeSvg('#e8a33d', '#0b0f14', { height: 1.6, stripe: 18, gap: 72, slant: 1.3 })
    expect(tape).toMatch(/^<svg width="4000" height="1.6"/)
    expect(tape).not.toMatch(/viewBox/)
    expect(tape).toMatch(/<pattern id="tape" width="90"/)
    expect(tape).toMatch(/fill="#e8a33d"/)
    const b = barSvg([{ text: '▌▌', color: '#a' }, { text: '▌', color: '#b' }], 8, 1.4, 9)
    expect(b.cells).toBe(3)
    expect(b.width).toBe(27)
    expect(b.source.match(/<rect /g)?.length).toBe(3)
    expect(b.source).toMatch(/<rect x="18.8" y="0" width="8" height="9" fill="#b"\/>/)
    expect(textWidth('ab', 10)).toBe(12)
    expect(textWidth('回合', 10)).toBe(20)
    const t = smallText([{ text: '回合 ', color: '#111' }, { text: '1<2', color: '#222', bold: true }], 10)
    expect(t.alt).toBe('回合 1<2')
    expect(t.source).toMatch(/1&lt;2/)
    expect(t.source).toMatch(/font-size="10"/)
  })

  test('care lines: twelve, one per ten minutes, then round again', async () => {
    expect(CARE_LINES.length).toBe(12)
    const at = (k: number) => careLine(k * CARE_EVERY_MS + 1)
    expect(at(0)).toBe(CARE_LINES[0])
    expect(careLine(CARE_EVERY_MS - 1)).toBe(CARE_LINES[0])
    expect(at(1)).toBe(CARE_LINES[1])
    expect(at(12)).toBe(CARE_LINES[0])
    expect(new Set(CARE_LINES).size).toBe(12)
    expect(careLine(0, [])).toBe('')
  })

  test('pace: use ahead of the time gone', async () => {
    const five = USAGE.rateLimits[0]!
    const p = pace(five, NOW)
    expect(p.verdict).toBe('用量超前')
    expect(p.left).toBe('2時10分')
    expect(pace({ kind: 'seven_day', percentUsed: 38, resetsAt: USAGE.rateLimits[1]!.resetsAt }, NOW).verdict).toBe(
      '節奏正常',
    )
    expect(pace({ kind: 'spend_limit', percentUsed: 10 }, NOW).timeGone).toBe(null)
  })
})

test('the band counts a turn and its tool call, on every surface', async ($, on) => {
  boot(on)
  on('tool.call', () => ({ result: {} }))
  on('turn.complete', () => ({ text: 'ok' }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.turn.complete({ answer: 'ok', durationMs: 3000, isAborted: false, turnId: 't1', reason: 'answer' })

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    const text = async (re: RegExp) => (await ui.find({ type: 'Text', text: re }))?.text

    expect(await text(/^上下文$/)).toBe('上下文')
    expect(await text(/^已用 /)).toBe('已用 11%')
    expect(await text(/^109K \/ 1M$/)).toBe('109K / 1M')
    expect(await text(/^5小時 /)).toBe('5小時 96%')
    expect(await text(/^剩2時10分/)).toBe('剩2時10分 · 用量超前')
    expect(await text(/^每週 /)).toBe('每週 38%')
    expect(await text(/^峰值 /)).toBe('峰值 1')
    expect(await text(/^5小時額度/)).toMatch(/^5小時額度已用 96%,將於 \d\d:\d\d 重置。$/)
    expect(await text(/^◆ LAPWING ▸$/)).toBe('◆ LAPWING ▸')
    expect(await text(/^今天也辛苦了|^寫了好久|^別擔心|^卡住的話|^別忘了吃飯|^眼睛累了|^你今天的努力|^慢慢來|^做完這段|^夜深了|^外面在下雨|^不管結果/)).toBe(careLine(NOW))
    if (surface === 'terminal') {
      expect(await text(/^上回合 $/)).toBe('上回合 ')
      expect(await text(/^3秒$/)).toBe('3秒')
      expect(await text(/^00:14$/)).toBe('00:14')
      expect(await text(/^○ 待命$/)).toBe('○ 待命')
    } else {
      const alts = await svgAlts(ui)
      expect(alts).toContain('工具呼叫 1   回合 1   上回合 3秒   失敗 0   運行 00:14')
      expect(alts.some(a => /^\d\d:\d\d 11月\d+日 週. {2}○ 待命$/.test(a))).toBe(true)
      expect(alts.filter(a => a === '警戒線').length).toBe(2)
      expect(alts.filter(a => a === '16 格').length).toBe(3)
    }
    await ui.unmount()
  }
})

test('working: the status line and light change', async ($, on) => {
  boot(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, isWorking: true } })
  expect((await ui.find({ type: 'Text', text: /^處理中/ }))?.text).toBe('處理中…')
  expect(await ui.find({ type: 'Text', text: /運作中/ })).toBe(undefined)
  await ui.unmount()
})

// The kit in Claude Code 2.1.325 ignores `test(name, { options }, body)` (the
// manifest default still arrives), so only the default name is tested here.
test('the persona name defaults to LAPWING', async ($, on) => {
  boot(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /^◆/ }))?.text).toBe('◆ LAPWING ▸')
  await ui.unmount()
})

test('the band keeps one row: narrow drops columns, short keeps the strip', async ($, on) => {
  boot(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const narrow = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, bodyColumns: 80 } })
  expect(await narrow.find({ type: 'Text', text: /^方案額度$/ })).not.toBe(undefined)
  expect(await narrow.find({ type: 'Text', text: /^每回合工具$/ })).toBe(undefined)
  await narrow.unmount()

  const narrower = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, bodyColumns: 50 } })
  expect(await narrower.find({ type: 'Text', text: /^方案額度$/ })).toBe(undefined)
  expect(await narrower.find({ type: 'Text', text: /^上下文$/ })).not.toBe(undefined)
  await narrower.unmount()

  const short = await $.ui.mount({ ...BAND, surface: 'terminal', props: { ...BAND.props, maxRows: 6 } })
  expect(await short.find({ type: 'Text', text: /^上下文$/ })).toBe(undefined)
  expect(await short.find({ type: 'Text', text: /^○ 待命$/ })).not.toBe(undefined)
  expect(await short.find({ type: 'Text', text: /^◆ LAPWING ▸$/ })).not.toBe(undefined)
  await short.unmount()
})

test('the limits column sits at the right edge', async ($, on) => {
  boot(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  for (const bodyColumns of [120, 80]) {
    const ui = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, bodyColumns } })
    const titles = (await ui.findAll({ type: 'Text', text: /^(上下文|每回合工具|方案額度)$/ })).map(t => t.text)
    expect(titles[titles.length - 1]).toBe('方案額度')
    expect(titles[0]).toBe('上下文')
    await ui.unmount()
  }
})

test('a survey keeps the band', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>engine</Text>
  })

  const ui = await $.ui.mount({ ...BAND, surface: 'desktop', props: { ...BAND.props, hasSurvey: true } })
  expect((await ui.find({ type: 'Text' }))?.text).toBe('engine')
  await ui.unmount()
})


test('appearance settings validate and keep city, lattice, glass and rain in order', () => {
  const safe = readAppearance('{"lightColor":"<script>","rainAmount":999,"glassStrength":-1,"city":"yes"}')
  expect(safe.lightColor).toBe('#ffe3a8')
  expect(safe.rainAmount).toBe(100)
  expect(safe.glassStrength).toBe(0)
  expect(safe.city).toBe(true)
  expect(readAppearance('invalid')).toEqual(APPEARANCE_DEFAULTS)
  const scene = sceneFor({ ...APPEARANCE_DEFAULTS, rain: true, lightColor: '#82baff' })
  expect(scene.indexOf('id="il-city"')).toBeLessThan(scene.indexOf('id="il-lattice"'))
  expect(scene.indexOf('id="il-lattice"')).toBeLessThan(scene.indexOf('id="il-glass-rain"'))
  expect(scene).toContain('#82baff')
  expect(sceneFor({ ...APPEARANCE_DEFAULTS, city: false })).not.toContain('id="il-city"')
})

test('appearance panel changes real rendering, validates input and preserves its entry when HUD is hidden', async ($, on) => {
  boot(on)
  const saved: string[] = []
  let opened = ''
  on('ui.open', (_, e) => { opened = e.id; return { value: { isPlaced: true } } })
  on('ui.close', () => ({ value: undefined }))
  on('config.set', (_, e) => { saved.push(String(e.value)); return { value: e.value } })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const hud = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await hud.press({ key: 'appearance-open' })
  expect(opened).toBe('interlinked-appearance')
  const panel = await $.ui.mount({ plugin: 'icanfixthat-hud', component: 'Pane', requestId: 'interlinked-appearance', surface: 'desktop', props: { title: '夜城外觀', isFocused: true, bodyColumns: 52, placement: 'inline', scroll: { offset: 0, bodyRows: 24 }, view: {} } })
  expect((await panel.findAll({ type: 'Select' })).length).toBe(8)
  await panel.select({ key: 'lightPreset', value: '#2fb4c9' })
  expect(JSON.parse(saved[saved.length - 1] ?? '').lightColor).toBe('#2fb4c9')
  await panel.select({ key: 'city', value: 'false' })
  expect(JSON.parse(saved[saved.length - 1] ?? '').city).toBe(false)
  await panel.input({ key: 'lightColor', text: '#82baff' })
  expect(JSON.parse(saved[saved.length - 1] ?? '').lightColor).toBe('#82baff')
  const count = saved.length
  await panel.input({ key: 'lightColor', text: '<script>' })
  expect(saved.length).toBe(count)
  await panel.input({ key: 'glassStrength', text: '999' })
  expect(JSON.parse(saved[saved.length - 1] ?? '').glassStrength).toBe(24)
  await panel.select({ key: 'hud', value: 'false' })
  expect(await hud.find({ type: 'Text', text: /^上下文$/ })).toBe(undefined)
  expect(await hud.find({ key: 'appearance-open' })).not.toBe(undefined)
  const backdrop = await $.ui.mount({ plugin: 'icanfixthat-hud', component: 'Backdrop', surface: 'desktop', props: { scene: 'interlinked', plugin: 'icanfixthat-hud', glass: false } })
  const source = String((await backdrop.find({ type: 'Svg' }))?.props.source)
  expect(source).not.toContain('id="il-city"')
  expect(source).toContain('#82baff')
  await panel.press({ key: 'appearance-reset' })
  expect(JSON.parse(saved[saved.length - 1] ?? '')).toEqual(APPEARANCE_DEFAULTS)
  await panel.press({ key: 'appearance-close' })
  await backdrop.unmount()
  await panel.unmount()
  await hud.unmount()
})
