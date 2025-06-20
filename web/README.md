# The Sound Approach - Web Application

A web companion to "The Sound Approach to Birding" mobile app, providing access to bird recordings and species information through a modern web interface.

## Features

- **Authentication**: Book code-based registration system matching the mobile app
- **Audio Playback**: High-quality bird recording streaming with custom mini audio players
- **Video Playback**: Sonogram video viewing for detailed analysis
- **Search**: Comprehensive search across recordings, species, and book pages
- **Library**: Browse recordings by book order or species
- **Profile Management**: Account settings, password changes, and account deletion
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (shared with mobile app)
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the web directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Audio/Video bucket names (same as mobile app)
NEXT_PUBLIC_AUDIO_HQ_BUCKET=audio-hq
NEXT_PUBLIC_AUDIO_LQ_BUCKET=audio-lq
NEXT_PUBLIC_SONOGRAMS_BUCKET=sonogramvideos
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── WelcomePage.tsx     # Landing page
│   │   ├── OnboardingPage.tsx  # User onboarding
│   │   ├── DashboardPage.tsx   # Main dashboard
│   │   ├── RecordingsPage.tsx  # Recordings library
│   │   ├── SearchPage.tsx      # Search functionality
│   │   ├── ProfilePage.tsx     # User profile/settings
│   │   ├── AuthModal.tsx       # Authentication modal
│   │   ├── MiniAudioPlayer.tsx # Audio player component
│   │   └── PageBadge.tsx       # Book page indicator
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── AudioContext.tsx    # Audio playback state
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility libraries
│   │   ├── supabase.ts         # Supabase client & queries
│   │   ├── mediaUtils.ts       # Media URL utilities
│   │   └── utils.ts            # General utilities
│   ├── types/               # TypeScript type definitions
│   └── styles/              # Global styles
├── public/                  # Static assets
├── middleware.ts            # Next.js middleware for auth
└── package.json
```

## Key Components

### Authentication Flow

1. **WelcomePage**: Landing page with sign in/up options
2. **AuthModal**: Handles sign in and sign up with book code validation
3. **OnboardingPage**: Multi-step introduction for new users
4. **AuthContext**: Manages authentication state and actions

### Main Application

1. **DashboardPage**: Main layout with navigation sidebar
2. **RecordingsPage**: Library view with recordings and species lists
3. **SearchPage**: Search functionality with filters and recent searches
4. **ProfilePage**: Account management and settings

### Audio System

1. **AudioContext**: Global audio state management
2. **MiniAudioPlayer**: Reusable audio player component
3. **Media utilities**: Functions for getting audio/video URLs

## Features Mapping from Mobile App

| Mobile Screen         | Web Equivalent  | Status                          |
| --------------------- | --------------- | ------------------------------- |
| WelcomeScreen         | WelcomePage     | ✅ Complete                     |
| OnboardingScreen      | OnboardingPage  | ✅ Complete                     |
| RecordingsListScreen  | RecordingsPage  | ✅ Complete                     |
| SearchScreen          | SearchPage      | ✅ Complete                     |
| ProfileSettingsScreen | ProfilePage     | ✅ Complete (without downloads) |
| MiniAudioPlayer       | MiniAudioPlayer | ✅ Complete                     |

## Database Schema

The web app uses the same Supabase database as the mobile app:

- `recordings` - Bird recording metadata
- `species` - Bird species information
- `book_codes` - Access codes for registration
- `user_activations` - User-code activation records
- `user_profiles` - User profile data

## Deployment

The application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **Railway**
- **Digital Ocean App Platform**

Make sure to set the environment variables in your deployment platform.

## Development Notes

- No offline functionality (downloads) as this is a web app
- Uses HTML5 audio/video elements for media playback
- Responsive design works on all device sizes
- Same authentication system as mobile app
- Shared Supabase backend with mobile app
