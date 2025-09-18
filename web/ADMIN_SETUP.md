# Admin Panel Setup

This admin panel provides a secure interface for managing recordings and species data in The Sound Approach app.

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Admin password for accessing the admin panel
ADMIN_PASSWORD=your_secure_admin_password_here

# Supabase service role key (for admin database operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Regular Supabase URL (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
```

## Supabase Storage Buckets Required

The admin panel expects these storage buckets to exist in your Supabase project:

- `audio-hq` - For high quality audio files (MP3/WAV)
- `audio-lq` - For low quality audio files (MP3/WAV)
- `sonagram-videos` - For sonogram video files (MP4)

## Database Schema

The admin panel works with these database tables:

- `recordings` - Recording data with media file references
- `species` - Species information (common and scientific names)

## Access

1. Navigate to `/admin/login`
2. Enter the admin password (set in ADMIN_PASSWORD env var)
3. Access the dashboard at `/admin/dashboard`

## Features

### Recordings Management

- View all recordings in a paginated table
- Edit recording details (title, species, site, etc.)
- Upload/replace media files (audio HQ, audio LQ, sonogram videos)
- Preview media files directly in the browser
- Files are automatically named using 4-digit recording numbers (e.g., `0001.mp3`)

### Species Management

- View all species in the database
- Edit species names (common and scientific)
- Add new species entries

## Security

- Protected by password authentication
- Uses separate Supabase service role for admin operations
- Session-based authentication with 1-hour expiry
- Middleware protection for all admin routes
- Admin operations are isolated from regular user authentication

## File Management

Files are managed through Supabase Storage:

- Files are named using the recording's `rec_number` (padded to 4 digits)
- Old files are automatically deleted when replaced
- Supports MP3, WAV for audio and MP4 for videos
- Database references store only the filename (without extension)
