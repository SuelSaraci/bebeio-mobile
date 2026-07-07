# Bebeio Mobile

React Native (Expo) baby-tracking app. **All tracking happens here.** Premium (Bebio Plus) is purchased on [bebeio-web](../bebeio-web) and synced via the API.

## Features

- Login / signup / baby setup (Firebase Auth + API)
- Home, Feeding, Sleep, Growth, Health, AI tabs
- Free tier with per-feature limits
- Bebio Plus unlocked when your account has an active web subscription

## Setup

```bash
cd bebeio-mobile
yarn install
cp .env.example .env
```

## Run

```bash
yarn start
yarn ios
yarn android
```

## Subscriptions

- **Web (Paddle):** checkout at `EXPO_PUBLIC_WEB_URL/upgrade` — Android and dev builds open this from the app
- **iOS App Store builds:** companion app only (Guideline 3.1.3(f)) — no prices, no website checkout links, no purchase CTAs; users who already subscribed on the web sync via **Sync account**
- App polls `GET /api/subscriptions/status` on login, app focus, and every 30s

### App Review notes (paste into App Store Connect)

> Bebio is a free companion app for our web-based baby tracking service. Subscriptions are purchased only on our website; the iOS app does not link to or promote external purchase. Signed-in users who already have Bebio Plus on their account receive premium access via our API.

## Stack

- Expo SDK 56 + dev client
- Firebase Auth + bebeio-api
- Paddle subscriptions handled on web + API
