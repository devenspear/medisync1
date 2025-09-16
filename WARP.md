# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: StillCaster — Next.js 15 (App Router), React 19, TypeScript, Tailwind, Vercel Postgres, ElevenLabs (voice/music), OpenAI, Stripe

Commands you will use often

- Install and run locally
  - Dependencies
    ```bash path=null start=null
    npm install
    ```
  - Dev server (http://localhost:3000)
    ```bash path=null start=null
    npm run dev
    ```
  - Production build
    ```bash path=null start=null
    npm run build
    ```
  - Start production server
    ```bash path=null start=null
    npm run start
    ```

- Initialize the database schema (Vercel Postgres)
  - Dev convenience endpoint that creates required tables/indexes
    ```bash path=null start=null
    curl -sS http://localhost:3000/api/init-db | jq
    ```

- Authenticate (get a JWT for protected APIs)
  - Sign up
    ```bash path=null start=null
    curl -sS -X POST http://localhost:3000/api/auth/signup \
      -H 'Content-Type: application/json' \
      -d '{"email":"user@example.com","password":"changeme"}' | tee /tmp/signup.json | jq
    ```
  - Or sign in
    ```bash path=null start=null
    curl -sS -X POST http://localhost:3000/api/auth/signin \
      -H 'Content-Type: application/json' \
      -d '{"email":"user@example.com","password":"changeme"}' | tee /tmp/signin.json | jq
    ```
  - Store token for subsequent requests (treat as secret)
    ```bash path=null start=null
    TOKEN=$(jq -r '.token // empty' /tmp/signin.json /tmp/signup.json 2>/dev/null | head -n1)
    ```
  - Verify token
    ```bash path=null start=null
    curl -sS -H "Authorization: Bearer ${TOKEN}" http://localhost:3000/api/auth/me | jq
    ```

- Generate an AI meditation script (server-side, uses OpenAI if configured; otherwise fallback)
  ```bash path=null start=null
  curl -sS -X POST http://localhost:3000/api/scripts \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
      "assessment": {
        "goal": "relaxation",
        "currentState": "stressed",
        "duration": 3,
        "experience": "beginner",
        "environment": "quiet",
        "wisdomSource": "Default/Universal",
        "selectedFeelings": ["Anxiety"],
        "userPrimer": "Quick reset"
      }
    }' | jq
  ```

- Preview a voice (ElevenLabs if configured; otherwise browser TTS fallback is used in-app)
  - Returns audio/mpeg; save to a file if needed
    ```bash path=null start=null
    curl -sS -X POST http://localhost:3000/api/voice/preview \
      -H 'Content-Type: application/json' \
      -d '{"voiceId":"female-1"}' \
      --output /tmp/voice-preview.mp3
    ```

- Generate ambient music (server-side ElevenLabs music; client will fallback to Web Audio API if unavailable)
  ```bash path=null start=null
  curl -sS -X POST http://localhost:3000/api/music \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{
      "duration": 1,
      "primaryTheme": {"displayName":"Celestial & Ethereal","keywords":"shimmering pads, ethereal textures"},
      "atmosphericElements": [{"displayName":"Gentle Rain","description":"Soft rainfall background"}],
      "soundscapeJourney": {"displayName":"Gentle Build","structure":"Soft intro, gentle build, fade out"}
    }' | jq
  ```

- Stripe checkout (requires STRIPE_* env set)
  ```bash path=null start=null
  curl -sS -X POST http://localhost:3000/api/payment/create-checkout \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{"plan":"monthly"}' | jq
  ```

- Debug pages in browser
  - Music debug console: http://localhost:3000/debug-music
  - General debug: http://localhost:3000/debug

- Linting, formatting, tests
  - Lint/format/test scripts are not configured in package.json. There is no unit test runner set up.

High-level architecture

- App Router (Next.js 15) in app/
  - UI entry: app/page.tsx renders AuthWrapper → LoginForm or Dashboard.
  - Debug pages: app/debug, app/debug-music for runtime verification and environment checks.
  - API routes (serverless handlers) under app/api/:
    - /api/auth: signup, signin, me — custom JWT auth; bearer token required for protected routes.
    - /api/scripts: generates or returns cached meditation scripts; caches by MD5 of assessment for 7 days.
    - /api/music: builds prompt via MusicPromptGenerator and calls ElevenLabs sound-generation.
    - /api/voice/preview: produces voice preview via ElevenLabs TTS.
    - /api/sessions: CRUD for saved session configs; /complete tracks completion and updates stats.
    - /api/user: preferences, limits, stats.
    - /api/payment: Stripe checkout + webhook; upgrades/downgrades users on events.
    - /api/init-db: creates required Vercel Postgres tables, indexes, and triggers for local/dev bootstrap.

- Core libraries in lib/
  - database.ts: Vercel Postgres data access and schema bootstrap. Tables: users, session_configs, meditation_scripts, session_completions, cached_meditation_scripts. Exposes typed operations.
  - auth.ts and authClient.ts: server-side password/JWT auth utilities and client-side token store (localStorage), plus withAuth middleware to protect API handlers.
  - scriptGenerator.ts: assembles a master prompt using promptTemplate.ts (+ MediSync_MasterPrompt_250914.md), calls OpenAI chat completions when OPENAI_API_KEY is present, and returns a structured script with title/sections. Includes robust fallback text generation.
  - promptTemplate.ts and promptConstants.ts: loads the master prompt from MediSync_MasterPrompt_250914.md (server-side), replaces variables (wisdom source, feelings, goal, max word count), and provides curated option lists for the UI.
  - voiceSynthesis.ts: wraps ElevenLabs TTS API and adds SSML processing; provides a full fallback using the browser SpeechSynthesis API when keys are absent; exposes helpers to generate audio URLs for playback.
  - musicSynthesis.ts: client helper that calls /api/music and returns a blob URL; includes a complete Web Audio API fallback (FallbackMusicSynthesis) that synthesizes an ambient tone and encodes it to WAV when server-side generation fails.
  - audioEngineV2.ts: browser-side playback engine that mixes voice and music via HTMLAudioElement + Web Audio API GainNodes, supports live volume control and a simple master bus; used by SessionPlayer.
  - rateLimiter.ts: in-memory rate limiting keyed by userId or IP with endpoint-specific limits. Suitable for dev/single instance; replace with Redis for distributed prod.
  - store.ts: Zustand store (persisted) for user, sessions, and minimal stats; session saves are local-only and constrained more for free users.
  - demoMode.ts: development-only toggles for a demo experience; enforced off in production.

- Key components
  - AssessmentFlow: 12-step flow to collect user goals, wisdom source, feelings, environment, duration, and music preferences; then calls /api/scripts to generate content and supports voice preview; hands off a SessionConfig.
  - SessionPlayer: orchestrates generation (if needed), ElevenLabs voice synthesis or browser TTS fallback, optional music generation, mixing/playback, a timer with 5-second fade-out, and stats updates.
  - AppleUI and other presentational components implement the Apple-inspired look and feel used across the flow.

- Data and caching model
  - Cached scripts: /api/scripts computes an MD5 of assessment inputs and stores the generated script in cached_meditation_scripts with hit counts, serving cached results for identical requests within 7 days.
  - Session completions: /api/sessions/complete records completions and, when >= 50% done, updates user stats (streak and minutes) via /api/user/stats.

- Infrastructure and build
  - next.config.ts configures output file tracing with includes/excludes and marks sharp and tone as serverExternalPackages.
  - App Router APIs run within the Next server runtime. No separate backend server is required.

Environment variables

Set these in your shell or .env.local before running features that require them:
- OPENAI_API_KEY — enables server-side script generation via OpenAI.
- ELEVENLABS_API_KEY — enables server-side TTS and music generation.
- NEXT_PUBLIC_ELEVENLABS_API_KEY — enables certain client behaviors; avoid embedding sensitive keys in the client unless intentional.
- JWT_SECRET — secret for signing JWTs (do not use the development default in production).
- STRIPE_SECRET_KEY — required for payments.
- STRIPE_WEBHOOK_SECRET — required to validate Stripe webhooks.
- STRIPE_MONTHLY_PRICE_ID, STRIPE_YEARLY_PRICE_ID — Stripe price IDs used by /api/payment/create-checkout.
- NEXT_PUBLIC_APP_URL — used for Stripe success/cancel redirects.

Important references

- README.md covers features, technology stack, quick start, debug console routes (/debug-music), and deployment notes (Vercel). Use the commands above for day-to-day development; see README for broader product context and design system.

Notes and caveats

- Without OPENAI/ELEVENLABS keys, the app operates in a fallback mode: scripts use local templates and voice/music use browser-side synthesis—sufficient for local UX testing.
- Rate limiting is in-memory and resets on server restart; it’s dev-oriented.
- Initialize the database using /api/init-db before relying on API features that read/write tables.
