import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'straddly.com',
  appName: 'straddly',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
