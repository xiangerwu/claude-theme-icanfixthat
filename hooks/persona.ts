// The persona slot: the portrait at the left of the HUD and the name on the
// status line.
//
// - Name: `persona_name` in the plugin's options (config menu, or
//   settings.json → pluginConfigs["icanfixthat-hud"].options). Empty = no name.
// - Portrait: put your own picture at assets/portrait.jpg (desktop, VS Code,
//   mobile; about 256×320) and assets/portrait.png (terminal; about 128×160).
//   Both are read when the session starts and are git-ignored, so art you
//   may use yourself is not redistributed with the repository. Missing, the
//   HUD draws an empty 「無訊號」 frame.
//
// The frame may be taller or narrower than the picture: the picture fills it,
// cropped at the sides (centred), never stretched.

/**
 * What she says on the status line, one at a time, a new one every ten
 * minutes. Rewrite them freely: any number of lines works.
 */
export const CARE_LINES: readonly string[] = [
  '今天也辛苦了，記得喝口水喔。',
  '寫了好久，要不要站起來伸個懶腰?',
  '別擔心，我一直都在這裡陪你。',
  '卡住的話先深呼吸，我們一起慢慢想。',
  '別忘了吃飯，你比任何 bug 都重要。',
  '眼睛累了嗎?看看遠方十秒鐘吧。',
  '你今天的努力，我都有看到喔。',
  '慢慢來沒關係，我不會催你的。',
  '做完這段，獎勵自己一杯好喝的吧。',
  '夜深了的話，答應我早點休息好嗎?',
  '外面在下雨呢，有你在就不覺得冷。',
  '不管結果怎樣，你都已經很棒了。',
]

/** Ten minutes. */
export const CARE_EVERY_MS = 10 * 60 * 1000

/** The line for this moment: the same for ten minutes, then the next. */
export function careLine(now: number, lines: readonly string[] = CARE_LINES): string {
  if (lines.length === 0) {
    return ''
  }
  const i = Math.floor(now / CARE_EVERY_MS) % lines.length

  return lines[i] ?? ''
}

/** The portrait framed as a hologram: the picture under pink scanlines. */
export function portraitSvg(jpegBase64: string, width: number, height: number): string {
  const w = width
  const ht = height

  return `<svg viewBox="0 0 ${w} ${ht}" width="${w}" height="${ht}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="frame"><rect x="1" y="1" width="${w - 2}" height="${ht - 2}" rx="3"/></clipPath>
    <pattern id="scan" width="${w}" height="2" patternUnits="userSpaceOnUse">
      <rect width="${w}" height="1" fill="#14061a" opacity="0.35"/>
    </pattern>
    <linearGradient id="tint" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ff4f8b" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#7a3cff" stop-opacity="0.22"/>
    </linearGradient>
    <style>
      @keyframes flick { 0%,94%,100% { opacity: 1 } 95% { opacity: .72 } 97% { opacity: .92 } }
      .holo { animation: flick 5s steps(1) infinite }
    </style>
  </defs>
  <g clip-path="url(#frame)" class="holo">
    <image href="data:image/jpeg;base64,${jpegBase64}" x="0" y="0" width="${w}" height="${ht}" preserveAspectRatio="xMidYMid slice"/>
    <rect width="${w}" height="${ht}" fill="url(#tint)"/>
    <rect width="${w}" height="${ht}" fill="url(#scan)"/>
  </g>
  <rect x="1" y="1" width="${w - 2}" height="${ht - 2}" rx="3" fill="none" stroke="#ff4f8b" stroke-width="1.5"/>
</svg>`
}

/** Drawn while there is no portrait: a framed, scanlined 「無訊號」 slot. */
export function placeholderSvg(width: number, height: number): string {
  const w = width
  const ht = height

  return `<svg viewBox="0 0 ${w} ${ht}" width="${w}" height="${ht}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="scan" width="${w}" height="3" patternUnits="userSpaceOnUse">
      <rect width="${w}" height="1" fill="#ff4f8b" opacity="0.10"/>
    </pattern>
    <style>
      @keyframes blink { 0%,60%,100% { opacity: .55 } 70% { opacity: .15 } }
      .ns { animation: blink 3.2s steps(1) infinite }
    </style>
  </defs>
  <rect x="1" y="1" width="${w - 2}" height="${ht - 2}" rx="3" fill="#120c18" stroke="#ff4f8b" stroke-width="1.5"/>
  <rect x="1" y="1" width="${w - 2}" height="${ht - 2}" rx="3" fill="url(#scan)"/>
  <text class="ns" x="${w / 2}" y="${ht / 2 + 3}" text-anchor="middle" fill="#ff4f8b"
        font-family="Microsoft JhengHei, PingFang TC, Noto Sans TC, sans-serif" font-size="9" letter-spacing="1">無訊號</text>
</svg>`
}
