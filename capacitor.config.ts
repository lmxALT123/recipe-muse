
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.recipemuse',
  appName: 'RecipeMuse',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://881add2f-83c8-4dc1-904f-25f82ff919f5.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
