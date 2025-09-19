# RLS Policies for Direct Upload System

## Overview

The direct upload system uses Supabase signed URLs which automatically bypass RLS policies for storage operations. However, we still need proper RLS policies for database operations and security.

## Required RLS Policies

### Storage Buckets

**Important**: Signed URLs from `createSignedUploadUrl()` automatically bypass RLS policies. This is the intended behavior and provides secure, temporary access to upload files.

The buckets should have RLS enabled but allow:

1. Admin service role access (for generating signed URLs)
2. Authenticated users with proper tokens (for direct uploads via signed URLs)

### Database Tables

#### recordings table

```sql
-- Enable RLS
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Admin access policy (for service role)
CREATE POLICY "Admin full access" ON recordings
    FOR ALL USING (true) WITH CHECK (true);

-- Read access for authenticated users
CREATE POLICY "Authenticated read access" ON recordings
    FOR SELECT USING (auth.role() = 'authenticated');
```

#### species table

```sql
-- Enable RLS
ALTER TABLE species ENABLE ROW LEVEL SECURITY;

-- Admin access policy (for service role)
CREATE POLICY "Admin full access" ON species
    FOR ALL USING (true) WITH CHECK (true);

-- Read access for authenticated users
CREATE POLICY "Authenticated read access" ON species
    FOR SELECT USING (auth.role() = 'authenticated');
```

## Security Model

### Admin Authentication

- Admin operations use session-based authentication via cookies
- Admin session tokens are validated server-side
- Admin operations use the service role key for full access

### Direct Upload Flow

1. **Token Generation**: Admin requests upload token (requires admin auth)
2. **Signed URL**: Server generates signed URL using service role
3. **Direct Upload**: Client uploads directly to Supabase (bypasses RLS via signed URL)
4. **Confirmation**: Admin confirms upload completion (requires admin auth)

### Security Checks

#### Upload Token Generation

- Validates admin session
- Generates time-limited signed URLs (10 minutes)
- Creates tracking tokens for confirmation

#### Upload Confirmation

- Validates admin session
- Verifies token format matches expected pattern
- Confirms file exists in storage before updating database
- Updates database with service role privileges

## Implementation Notes

### Why This Approach Works

1. **No 413 Errors**: Files upload directly to Supabase, not through your server
2. **Secure**: Signed URLs are time-limited and specific to file/bucket
3. **Scalable**: No server resources used for file transfer
4. **Authenticated**: All admin operations require proper authentication

### Token Security

- Upload tokens include recording ID and media type to prevent misuse
- Tokens are validated on confirmation to ensure they match the request
- Signed URLs expire automatically (10 minutes)

### Error Handling

- File type validation on both client and server
- Upload progress tracking with XMLHttpRequest
- Automatic cleanup on failed uploads
- Comprehensive error messages for debugging

## Environment Variables Required

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage Bucket Names
AUDIO_HQ_BUCKET=audio-hq
AUDIO_LQ_BUCKET=audio-lq
SONAGRAMS_BUCKET=sonogramvideos

# Admin Authentication
ADMIN_PASSWORD=your_admin_password
```

## Testing Checklist

- [ ] Admin can generate upload tokens
- [ ] Files upload directly to correct Supabase buckets
- [ ] Upload progress is tracked accurately
- [ ] Database is updated after successful uploads
- [ ] Failed uploads are handled gracefully
- [ ] File type validation works correctly
- [ ] Large files (>10MB) upload without 413 errors
- [ ] Multiple file uploads work simultaneously
- [ ] Signed URLs expire correctly
- [ ] Invalid tokens are rejected
