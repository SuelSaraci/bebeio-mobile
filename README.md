# Bebeio Mobile

React Native (Expo) companion app for [bebio-web](../bebio-web). Same baby-tracking features and visual style, with **bottom tab navigation** for a native mobile experience.

## Features

- Login / signup / baby setup flow (demo mode)
- **Home** — daily stats, quick log, activity feed
- **Feeding** — breast, bottle, solid food logging
- **Sleep** — sessions with weekly chart
- **Growth** — measurements, weight trend, milestones
- **Health** — vaccinations, appointments, medical notes
- **AI** — parenting assistant chat

## Run

```bash
cd bebeio-mobile
npm install
npm start
```

Then press `i` for iOS simulator or `a` for Android emulator, or scan the QR code with Expo Go.

## Stack

- Expo SDK 56
- React Navigation (bottom tabs)
- date-fns, lucide-react-native, react-native-gifted-charts
