import sharp from "sharp"

const out = "ios/App/App/Assets.xcassets/Splash.imageset"
const svg = `<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="2732" y2="2732">
      <stop stop-color="#2563FF"/>
      <stop offset="1" stop-color="#00D4CC"/>
    </linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="36" flood-color="#08223A" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="2732" height="2732" fill="url(#g)"/>
  <g filter="url(#s)" transform="translate(1016 820) scale(4.4)">
    <path d="M50 42C77 39 106 40 125 48C137 53 145 65 150 79C155 95 151 107 139 114C123 123 105 117 88 106C76 98 63 96 50 96V42Z" fill="#FFFFFF"/>
    <path d="M50 122C65 119 78 122 92 131C107 141 126 149 145 141C145 158 135 171 119 179C101 188 74 188 50 186V122Z" fill="#FFFFFF"/>
  </g>
  <text x="1366" y="1785" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="136" font-weight="700" fill="#FFFFFF">Drift</text>
  <text x="1366" y="1872" text-anchor="middle" font-family="Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="44" font-weight="500" fill="#FFFFFF" fill-opacity="0.9">Find your people.</text>
</svg>`

await Promise.all(
  ["splash-2732x2732-2.png", "splash-2732x2732-1.png", "splash-2732x2732.png"].map((name) =>
    sharp(Buffer.from(svg)).png().toFile(`${out}/${name}`)
  )
)

console.log("iOS splash generated")
