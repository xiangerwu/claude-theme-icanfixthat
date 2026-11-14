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
export const SCENE = `<svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
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

export const LOOK: ThemeSetArgs = {
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
