import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.aweandco.drift",
  appName: "Drift",
  webDir: "capacitor-web",
  server: {
    url: "https://driftapp.me",
    cleartext: false,
  },
}

export default config
