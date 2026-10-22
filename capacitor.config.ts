import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.spendwise.app',
  appName: 'SpendWise',
  webDir: 'dist',
  backgroundColor: '#07080d',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_spendwise',
      iconColor: '#B6FF3B',
    },
    // Edge-to-edge: the page draws behind the status bar and pads itself with env(safe-area-inset-*).
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'DARK',
    },
  },
}

export default config
