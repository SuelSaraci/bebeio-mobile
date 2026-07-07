const appJson = require("./app.json");

const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

const googleNativeScheme = (clientId) =>
  clientId.split(".").reverse().join(".");

const urlSchemes = ["bebeio"];
if (iosGoogleClientId) {
  urlSchemes.push(googleNativeScheme(iosGoogleClientId));
}

/** @type {import('expo/config').ExpoConfig} */
module.exports = () => ({
  ...appJson,
  expo: {
    ...appJson.expo,
    owner: "suel_saraqi",
    plugins: [
      ...(appJson.expo.plugins || []),
      "expo-sharing",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#D95C74",
          sounds: [],
        },
      ],
    ],
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...(appJson.expo.ios?.infoPlist || {}),
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [{ CFBundleURLSchemes: urlSchemes }],
        UIBackgroundModes: ["remote-notification"],
      },
    },
    android: {
      ...appJson.expo.android,
      versionCode: 1,
      permissions: [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "SCHEDULE_EXACT_ALARM",
      ],
      blockedPermissions: ["android.permission.RECORD_AUDIO"],
    },
    extra: {
      ...(appJson.expo.extra || {}),
      eas: {
        ...(appJson.expo.extra?.eas || {}),
        projectId:
          process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
          "a54d29e2-d0db-4da0-907a-83dcdea7fb32",
      },
    },
  },
});
