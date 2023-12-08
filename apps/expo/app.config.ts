import { ConfigContext, ExpoConfig } from '@expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
  owner: process.env.EAS_OWNER,
  plugins: ['expo-router'],
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  platforms: ['ios', 'android'],
  name: 'T4 App',
  slug: 't4-app',
  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
})
