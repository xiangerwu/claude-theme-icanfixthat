import type { ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'

// The theme half of the mod: pure data, no `$` (the hooks live in register.tsx).
//
// "Interlinked" — the Blade Runner 2049 baseline test, as a look.
// Night-city noir: cold blue-black surfaces, an interrogation-cyan glow,
// Vegas amber at the edges. Committed to dark; the scene is the night.
const { theme, problems: themeProblems } = makeColors({
  label: 'Interlinked',
  only: 'dark',
  roles: {
    accent: '#2fb4c9', // interrogation cyan — keywords
    danger: '#e0483c', // warning red — names
    success: '#3fae74', // cold green — strings
    warning: '#e08a2a', // Vegas amber — variables
    pro: '#9a6bd6', // replicant violet — literals
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b0f12',
        'surface-1': '#0e141a',
        'surface-2': '#131b22',
        'surface-3': '#182028',
        'text-primary': '#e6eef3',
        'text-secondary': '#a6bcc8',
        'text-muted': '#90a4b0',
      },
    },
    git: {
      added: '#3fae74',
      removed: '#e0483c',
      modified: '#2fb4c9',
      merged: '#9a6bd6',
      closed: '#8a97a1',
      conflicting: '#e08a2a',
      draft: '#66757f',
    },
  },
  codeTheme: { dark: 'nord' },
})

// A slow lattice of interlinked cells behind a cold scan. Dark, so a glass
// veil over it keeps the words first. Runs no script; CSS animates it.
const BASE_SCENE = `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="il-bg" cx="28%" cy="22%" r="95%">
      <stop offset="0%" stop-color="#16222c"/>
      <stop offset="48%" stop-color="#0d141a"/>
      <stop offset="100%" stop-color="#070a0d"/>
    </radialGradient>
    <radialGradient id="il-vegas" cx="88%" cy="90%" r="55%">
      <stop offset="0%" stop-color="#e08a2a" stop-opacity="0.16"/>
      <stop offset="60%" stop-color="#e08a2a" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#e08a2a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="il-scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2fb4c9" stop-opacity="0"/>
      <stop offset="50%" stop-color="#2fb4c9" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#2fb4c9" stop-opacity="0"/>
    </linearGradient>
    <style>
      @keyframes il-breathe { 0%,100% { opacity:0.22 } 50% { opacity:0.6 } }
      @keyframes il-breathe2 { 0%,100% { opacity:0.55 } 50% { opacity:0.18 } }
      @keyframes il-scan { 0% { transform: translateY(-260px) } 100% { transform: translateY(1160px) } }
      .il-link { stroke:#2fb4c9; stroke-width:1.1; fill:none; animation: il-breathe 7s ease-in-out infinite }
      .il-link.b { stroke:#9a6bd6; animation: il-breathe2 9s ease-in-out infinite }
      .il-node { fill:#9fe4ef; animation: il-breathe 5.5s ease-in-out infinite }
      .il-node.b { fill:#c7a9ef; animation: il-breathe2 6.5s ease-in-out infinite }
      .il-scanbar { animation: il-scan 11s linear infinite }
      @keyframes il-edge { 0%,100% { opacity:1 } 50% { opacity:0.75 } }
      .il-edge { animation: il-edge 8s ease-in-out infinite }
      .il-edge .il-link { stroke-width:2.4; animation: none; opacity:1 }
      .il-edge .il-node { animation: none; opacity:1 }
    </style>
  </defs>

  <rect width="1600" height="1000" fill="url(#il-bg)"/>
  <rect width="1600" height="1000" fill="url(#il-vegas)"/>

  <g opacity="0.5">
    <!-- interlinked lattice -->
    <path class="il-link" d="M180,180 L440,300 L300,560 L120,420 Z"/>
    <path class="il-link b" d="M440,300 L760,220 L820,480 L300,560"/>
    <path class="il-link" d="M760,220 L1080,360 L820,480"/>
    <path class="il-link b" d="M1080,360 L1360,260 L1300,560 L1080,360"/>
    <path class="il-link" d="M300,560 L520,760 L820,480"/>
    <path class="il-link b" d="M520,760 L900,820 L1300,560"/>
    <path class="il-link" d="M900,820 L1180,920 L1300,560"/>

    <circle class="il-node" cx="180" cy="180" r="4.5"/>
    <circle class="il-node b" cx="440" cy="300" r="5.5"/>
    <circle class="il-node" cx="760" cy="220" r="5"/>
    <circle class="il-node b" cx="1080" cy="360" r="6"/>
    <circle class="il-node" cx="1360" cy="260" r="4.5"/>
    <circle class="il-node b" cx="300" cy="560" r="5.5"/>
    <circle class="il-node" cx="820" cy="480" r="6.5"/>
    <circle class="il-node b" cx="1300" cy="560" r="5"/>
    <circle class="il-node" cx="520" cy="760" r="5"/>
    <circle class="il-node b" cx="900" cy="820" r="6"/>
    <circle class="il-node" cx="1180" cy="920" r="4.5"/>
    <circle class="il-node b" cx="120" cy="420" r="4"/>
  </g>

  <!-- The lattice runs on under the side panels (task list on the left,
       session pane on the right), brighter than the middle so it reads
       through their frosting. -->
  <g class="il-edge">
    <path class="il-link b" d="M0,90 L180,180 L40,330 L0,300"/>
    <path class="il-link" d="M40,330 L120,420 L20,640 L0,620"/>
    <path class="il-link b" d="M20,640 L300,560 M20,640 L150,880 L0,960"/>
    <path class="il-link" d="M180,180 L260,40 L90,0 M260,40 L300,240 L120,420"/>
    <path class="il-link b" d="M300,240 L230,520 L150,880 M230,520 L300,760 L150,880"/>
    <path class="il-link" d="M1600,140 L1480,120 L1360,260 L1540,400 L1600,380"/>
    <path class="il-link b" d="M1540,400 L1300,560 M1540,400 L1580,700 L1600,690"/>
    <path class="il-link" d="M1580,700 L1460,860 L1180,920 M1460,860 L1600,980"/>
    <path class="il-link b" d="M1480,120 L1300,40 L1240,200 L1360,260 M1240,200 L1250,420 L1540,400"/>
    <path class="il-link" d="M1250,420 L1300,560 M1250,420 L1340,680 L1460,860 M1340,680 L1580,700"/>
    <circle class="il-node b" cx="40" cy="330" r="4.5"/>
    <circle class="il-node" cx="20" cy="640" r="5"/>
    <circle class="il-node b" cx="150" cy="880" r="4.5"/>
    <circle class="il-node" cx="260" cy="40" r="4"/>
    <circle class="il-node b" cx="300" cy="240" r="5"/>
    <circle class="il-node" cx="230" cy="520" r="4.5"/>
    <circle class="il-node b" cx="300" cy="760" r="4"/>
    <circle class="il-node" cx="1480" cy="120" r="4.5"/>
    <circle class="il-node b" cx="1540" cy="400" r="5.5"/>
    <circle class="il-node" cx="1580" cy="700" r="4.5"/>
    <circle class="il-node b" cx="1460" cy="860" r="5"/>
    <circle class="il-node" cx="1300" cy="40" r="4"/>
    <circle class="il-node b" cx="1240" cy="200" r="4.5"/>
    <circle class="il-node" cx="1250" cy="420" r="5"/>
    <circle class="il-node b" cx="1340" cy="680" r="4.5"/>
  </g>

  <g class="il-scanbar">
    <rect x="0" y="0" width="1600" height="200" fill="url(#il-scan)"/>
    <rect x="0" y="100" width="1600" height="1.5" fill="#9fe4ef" opacity="0.4"/>
  </g>

</svg>`

const BASE_LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: {
    scene: 'interlinked',
    // Light frosting, so the side panels (task list, session pane) carry the
    // scene's colors and lines through. One glass covers every panel.
    glass: { blur: 1, tint: '#0a0e12', opacity: 0.18 },
  },
}

/** The line that would stop Desktop painting the look, if any. */
export const UNPAINTED = themeProblems.find(line => line.startsWith("Desktop won't paint"))

export const APPEARANCE_DEFAULTS = {
  city: true, rain: false, rainAmount: 45, rainSpeed: 35,
  glass: true, glassStrength: 12, light: true, lightStrength: 30,
  lightColor: '#ffe3a8', scan: true, scanSpeed: 11, hud: true,
  hudWidth: 100, motion: false,
}
export type Appearance = typeof APPEARANCE_DEFAULTS
export const APPEARANCE_RANGES = {
  rainAmount: [10, 100], rainSpeed: [10, 100], glassStrength: [0, 24],
  lightStrength: [0, 100], scanSpeed: [6, 30], hudWidth: [80, 100],
} as const

/** Validate the saved string once; interpolated SVG values are only typed bounds/hex. */
export function readAppearance(raw: unknown): Appearance {
  const value = { ...APPEARANCE_DEFAULTS }
  if (typeof raw !== 'string') return value
  try {
    const saved = JSON.parse(raw)
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return value
    for (const key of ['city', 'rain', 'glass', 'light', 'scan', 'hud', 'motion'] as const) {
      if (typeof saved[key] === 'boolean') value[key] = saved[key]
    }
    for (const key of Object.keys(APPEARANCE_RANGES) as (keyof typeof APPEARANCE_RANGES)[]) {
      if (Number.isFinite(saved[key])) {
        const [min, max] = APPEARANCE_RANGES[key]
        value[key] = Math.max(min, Math.min(max, saved[key]))
      }
    }
    if (typeof saved.lightColor === 'string' && /^#[0-9a-f]{6}$/i.test(saved.lightColor)) value.lightColor = saved.lightColor
  } catch { /* Malformed old settings retain safe defaults. */ }
  return value
}

const CITY = `
        <defs>
          <linearGradient id="il-city-facade" x2="0" y2="1"><stop stop-color="#213440"/><stop offset="1" stop-color="#060d16"/></linearGradient>
          <linearGradient id="il-city-haze" x2="0" y2="1"><stop stop-color="#060e1500"/><stop offset="1" stop-color="#080f17"/></linearGradient>
          <pattern id="il-city-cyan" width="32" height="42" patternUnits="userSpaceOnUse"><rect x="4" y="5" width="7" height="5" fill="#80cbda" opacity=".65"/><rect x="20" y="5" width="7" height="5" fill="#f4c581" opacity=".5"/><rect x="4" y="26" width="7" height="5" fill="#5ca5c3" opacity=".38"/></pattern>
          <pattern id="il-city-gold" width="40" height="48" patternUnits="userSpaceOnUse"><rect x="5" y="6" width="9" height="6" fill="#f0c17c" opacity=".7"/><rect x="25" y="30" width="9" height="6" fill="#e8b076" opacity=".5"/><rect x="5" y="30" width="9" height="6" fill="#a6b7cd" opacity=".3"/></pattern>
        </defs>
        <g fill="#142330" stroke="#314552" stroke-width="1">
          <path d="M0 570H130V430H240V590H380V510H520V710H680V640H820V700H960V570H1080V660H1190V460H1310V520H1460V390H1600V1000H0Z"/>
        </g>
        <g fill="url(#il-city-facade)" stroke="#47606c" stroke-opacity=".6" stroke-width="2">
          <path d="M35 1000V350H65V280H155V350H185V1000Z"/>
          <path d="M235 1000V450H400V1000Z"/>
          <path d="M445 1000V570H560V1000Z"/>
          <path d="M620 1000V720H775V1000Z"/>
          <path d="M840 1000V680H980V1000Z"/>
          <path d="M1030 1000V490H1180V1000Z"/>
          <path d="M1240 1000V290H1270V220H1370V290H1410V1000Z"/>
          <path d="M1460 1000V430H1585V1000Z"/>
        </g>
        <g fill="url(#il-city-cyan)"><rect x="48" y="368" width="124" height="632"/><rect x="457" y="588" width="91" height="412"/><rect x="852" y="698" width="116" height="302"/><rect x="1254" y="312" width="142" height="688"/></g>
        <g fill="url(#il-city-gold)"><rect x="248" y="470" width="139" height="530"/><rect x="632" y="738" width="131" height="262"/><rect x="1043" y="510" width="124" height="490"/><rect x="1472" y="448" width="101" height="552"/></g>
        <g opacity=".8"><rect x="68" y="286" width="84" height="5" fill="#66cddd"/><rect x="244" y="484" width="9" height="125" fill="#eb69b6"/><rect x="1042" y="497" width="125" height="6" fill="#dfad65"/><rect x="1275" y="226" width="90" height="5" fill="#83b8ff"/><rect x="1391" y="332" width="7" height="145" fill="#699ee6"/></g>
        <rect width="1600" height="1000" fill="url(#il-city-haze)" opacity=".35"/>
      `

export function sceneFor(p: Appearance): string {
  const start = BASE_SCENE.indexOf('  <g opacity="0.5">')
  const scanStart = BASE_SCENE.indexOf('  <g class="il-scanbar">')
  const lattice = BASE_SCENE.slice(start, scanStart)
  const scan = p.scan ? BASE_SCENE.slice(scanStart, BASE_SCENE.lastIndexOf('</svg>')) : ''
  const rain = p.rain ? Array.from({ length: Math.round(p.rainAmount * .4) }, (_, i) =>
    `<ellipse class="il-rain" cx="${((i * 37 + 11) % 100) * 16}" cy="${((i * 53 + 29) % 100) * 9}" rx="${2 + i % 3}" ry="${2.5 + i % 4}" style="animation-duration:${(22 - p.rainSpeed * .16) * (.7 + i % 7 * .13)}s;animation-delay:-${i * 7 % 23}s"/>`).join('') : ''
  return BASE_SCENE.slice(0, start) + `
  <defs>
    <filter id="il-distance"><feGaussianBlur stdDeviation="3.5"/></filter>
    <filter id="il-glass"><feGaussianBlur stdDeviation="${p.glass ? p.glassStrength : 0}"/></filter>
    <radialGradient id="il-light" cx="100%" cy="0%" r="95%"><stop stop-color="${p.lightColor}" stop-opacity=".75"/><stop offset=".4" stop-color="${p.lightColor}" stop-opacity=".3"/><stop offset="1" stop-color="${p.lightColor}" stop-opacity="0"/></radialGradient>
    <linearGradient id="il-edge-light"><stop stop-color="#2fb4c9" stop-opacity="0"/><stop offset=".5" stop-color="#e8a33d"/><stop offset="1" stop-color="#2fb4c9" stop-opacity="0"/></linearGradient>
    <style>
      @keyframes il-rain-hit { 0% { opacity:0; transform:translateY(0) scale(.2) } 4% { opacity:1; transform:translateY(0) scale(1.15) } 10% { transform:translateY(0) scale(1) } 85% { opacity:.85 } 100% { opacity:0; transform:translateY(160px) scale(.85,1.2) } }
      @keyframes il-top-edge { from { transform:translateX(-500px) } to { transform:translateX(1600px) } }
      .il-rain { fill:#b3dfed22;stroke:#b5dbe56b;stroke-width:.8;transform-box:fill-box;transform-origin:center;animation:il-rain-hit 16s ease-in infinite }
      .il-top-edge { animation:il-top-edge 12s linear infinite;animation-play-state:${p.motion ? 'running' : 'paused'} }
      .il-scanbar { animation-duration:${p.scanSpeed}s }
    </style>
  </defs>
  <!-- Far to near: city, lattice, then the glass (frosted blurs both), rain on the glass. -->
  <g id="il-distant" filter="url(#il-glass)">
    ${p.city ? `<g id="il-city" transform="translate(96 380) scale(.88 .62)" opacity=".62" filter="url(#il-distance)">${CITY}</g>` : ''}
    <g id="il-lattice">${lattice}</g>
  </g>
  ${p.light ? `<rect id="il-light-plane" width="1600" height="1000" fill="url(#il-light)" opacity="${p.lightStrength / 100}"/>` : ''}
  ${scan}
  <g id="il-glass-rain">${rain}</g>
  <rect class="il-top-edge" y="0" width="500" height="2" fill="url(#il-edge-light)"/>
</svg>`
}

export function lookFor(p: Appearance): ThemeSetArgs {
  return { ...BASE_LOOK, backdrop: { scene: 'interlinked', glass: p.glass ? { blur: p.glassStrength, tint: '#0a0e12', opacity: .18 } : false } }
}
export const SCENE = sceneFor(APPEARANCE_DEFAULTS)
export const LOOK = lookFor(APPEARANCE_DEFAULTS)
