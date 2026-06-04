import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.aweandco.drift",
  appName: "Drift",
  webDir: "capacitor-web",
  server: {
    url: "https://driftapp.me",
    cleartext: false,
    allowNavigation: [
      "driftapp.me",
      "*.driftapp.me",
      "*.supabase.co",
      "api.bigdatacloud.net",
      "geocoding-api.open-meteo.com",
    ],
  },
}

export default config
