// SVG pieces for the surfaces that draw `Svg` (desktop, VS Code, mobile).
// Pure, so the tests can read what they make.
//
// An `Svg` with no `width` takes the markup's own width, up to its slot, and
// an SVG without a viewBox is drawn at 1:1 and clipped, never scaled. So a
// very wide strip with a fixed height spans any slot without its stripes
// stretching.

const WIDE = 4000

/** The tape's measures, in CSS px. */
export type Tape = { height: number; stripe: number; gap: number; slant: number }

/** A caution-tape strip: slanted stripes in `color`, `gap` apart, over `ground`. */
export function tapeSvg(color: string, ground: string, tape: Tape): string {
  const { height, stripe, gap, slant } = tape
  const unit = stripe + gap

  return `<svg width="${WIDE}" height="${height}" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="tape" width="${unit}" height="${height}" patternUnits="userSpaceOnUse">
      <polygon points="0,${height} ${slant},0 ${slant + stripe},0 ${stripe},${height}" fill="${color}"/>
    </pattern>
  </defs>
  <rect width="${WIDE}" height="${height}" fill="${ground}"/>
  <rect width="${WIDE}" height="${height}" fill="url(#tape)"/>
</svg>`
}

/** One run of same-colored cells, as format.ts's bars make them. */
type Cells = { text: string; color: string }

/**
 * A bar of separate cells, `cell` wide and `gap` apart: the surfaces that
 * draw Svg get exact widths, which a character cell cannot give.
 */
export function barSvg(runs: readonly Cells[], cell: number, gap: number, height: number) {
  const colors = runs.flatMap(r => Array.from(r.text, () => r.color))
  const width = Math.ceil(colors.length * (cell + gap) - gap)
  const rects = colors
    .map((c, i) => `<rect x="${+(i * (cell + gap)).toFixed(2)}" y="0" width="${cell}" height="${height}" fill="${c}"/>`)
    .join('')

  return {
    source: `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`,
    width,
    height,
    cells: colors.length,
  }
}

/** One run of text in a line of small type. */
export type Run = { text: string; color: string; bold?: boolean }

const FONT = 'Cascadia Mono, Consolas, Microsoft JhengHei, PingFang TC, monospace'

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The width a run takes: CJK and full-width signs one em, the rest 0.6. */
export function textWidth(text: string, fontSize: number): number {
  let em = 0

  for (const ch of text) {
    em += (ch.codePointAt(0) ?? 0) >= 0x2e80 || ch === '●' || ch === '○' ? 1 : 0.6
  }

  return em * fontSize
}

/** A line of small type: the source, its size and the words, for `alt`. */
export function smallText(runs: readonly Run[], fontSize: number) {
  const text = runs.map(r => r.text).join('')
  const width = Math.ceil(textWidth(text, fontSize)) + 2
  const height = Math.ceil(fontSize * 1.4)
  const spans = runs
    .map(r => `<tspan fill="${r.color}"${r.bold ? ' font-weight="700"' : ''}>${escape(r.text)}</tspan>`)
    .join('')

  return {
    source: `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><text x="0" y="${Math.round(fontSize * 1.05)}" font-family="${FONT}" font-size="${fontSize}" xml:space="preserve">${spans}</text></svg>`,
    width,
    height,
    alt: text,
  }
}
