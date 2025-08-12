import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.belotecoinchescorer.app',
  appName: 'Belote Coinche Scorer',
  webDir: 'dist',
  server: {
  allowNavigation: [
    'zjmspwhsedkmnlbptpnj.supabase.co'
  ]
}
  
};

export default config;
