import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.aweandco.drift",
  appName: "Drift",
  webDir: "capacitor-web",
  server: {
    url: "https://v0-traveler-meetup-app.vercel.app",
    cleartext: false,
  },
}

export default config
