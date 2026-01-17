# Project Instructions for Claude Code

## Build & Dev Commands

**DO NOT run these commands** - the user runs them manually:
- `npm run dev`
- `npm run build`
- `npm start`
- Any dev server or build commands

## Permissions

You have full access to:
- Create, edit, delete any files and folders
- Run git commands
- Run file operations (mkdir, rm, cp, mv, etc.)
- Run npx and node commands

## Project Structure

This is a Next.js 15 project with:
- TypeScript
- Tailwind CSS
- NextAuth.js for authentication
- Supabase as database
- ElevenLabs Scribe v2 for voice transcription (planned)

## Key Files

- `/src/app/` - Next.js App Router pages
- `/src/components/` - React components
- `/src/lib/` - Utility functions and configurations
- `/src/lib/auth.ts` - NextAuth configuration
- `/src/lib/supabase.ts` - Supabase client

## Coding Standards

- Use TypeScript for all new files
- Follow existing code patterns
- Use Tailwind CSS for styling
- Prefer Server Components when possible
- Use "use client" directive only when needed