# The Sound Approach

A React Native mobile application for high-quality audio playback with sonogram visualizations, built with Expo.

## Features

- 🎵 High-quality audio playback
- 📊 Sonogram visualization support
- 📱 Cross-platform (iOS and Android)
- 💾 Offline mode with downloadable content
- 🌓 Light/Dark theme support
- 🔐 User authentication
- 📱 Responsive design with both mini and full audio players

## Tech Stack

- React Native
- Expo
- TypeScript
- React Navigation
- React Native Paper
- Supabase
- React Query
- Expo AV for audio playback
- Expo FileSystem for offline storage

## Prerequisites

- Node.js (v16 or higher)
- Yarn (required)
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio & Android SDK (for Android development)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd the-sound-approach
```

2. Install dependencies:

```bash
yarn install
```

3. Start the development server:

```bash
yarn start
```

## Running the App

- For iOS:

```bash
yarn ios
```

- For Android:

```bash
yarn android
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── config/         # Configuration files
├── context/        # React Context providers
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and services
├── navigation/     # Navigation configuration
├── screens/        # App screens
└── types/          # TypeScript type definitions
```

## Building for Production

### Android

```bash
yarn build:android:production
```

### iOS

```bash
yarn build:ios:production
```

## Development

- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint errors
- `yarn format` - Format code with Prettier

## Environment Variables

Required environment variables:

- `AUDIO_HQ_BUCKET` - Supabase bucket for high-quality audio
- `AUDIO_LQ_BUCKET` - Supabase bucket for low-quality audio
- `SONOGRAMS_BUCKET` - Supabase bucket for sonogram videos

## License

[License Type] - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

# Paid stuff

- supabase 25€ per month ok
- developer account apple 99€ per month
- google developer 25€ onee time
- cursor 20€ per month, or 16€ per month paid yearly
- expo based on usage. no idea how much, depends on what is used ok
- email smtp??? needed for auth. resend is 20 month forever. but sound approach probably already has email services that could be used
