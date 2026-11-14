# FitForge

A complete mobile-first workout planner built with **Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS 4**. Includes a server-side OpenAI integration and a fully working, equipment-aware local generator. No account or external database is required.

## Open the app

The project has already been installed, built, and started in the workspace. Open the **FitForge live preview** to use it from your phone.

To run it elsewhere, use Node.js 20.9+ (Node.js 22 LTS recommended):

```bash
cd fitforge
npm ci
npm run dev
```

Open `http://localhost:3000`. The development server binds to `0.0.0.0`, so it also works in hosted preview environments. Browser requests use the relative `/api/generate-workout` URL—there are no browser-facing localhost service URLs.

For production:

```bash
npm run build
npm start
```

Deploy the project directory to a **Node-capable Next.js host** (for example, Vercel), not static-only hosting. Keep `package-lock.json` for reproducible installs.

## Optional OpenAI connection

The app works immediately **without an API key**. To enable AI enhancement, copy `.env.example` to `.env.local` and set:

```dotenv
OPENAI_API_KEY=your_real_key_here
OPENAI_MODEL=gpt-4o-mini
```

Restart the server after changing environment variables. On a hosting platform, set these in its server environment settings. **Never** add a `NEXT_PUBLIC_` prefix, commit a real key, or put it in client code.

The server asks OpenAI for a strict JSON-schema response containing a title, coaching tip, and exercise IDs. It validates the selected IDs against the permitted equipment, experience, and muscle group, rejects duplicates, checks full-body coverage, and uses the authored exercise library for instructions. Sets, reps, rest, and estimated duration are calculated on the server. Missing keys, timeouts, refusals, and invalid AI selections all fall back to the local generator. The workout clearly identifies whether it came from AI enhancement or the local library.

Live provider calls require your own valid key and have not been made as part of setup; provider success/failure paths are covered with mocked tests.

## What works

- Premium responsive landing page, local fonts, optimized hero asset, mobile navigation, and reduced-motion support.
- Five-step accessible builder: all nine body parts, seven equipment choices, three experience levels, four goals, and five time budgets.
- Equipment- and experience-filtered workouts, full-body movement coverage, and mixed-equipment variety.
- Warm-up, exercises, sets, reps or timed holds, rest, instructions, difficulty, coaching, and cool-down.
- Working sets respect the time budget and experience-based volume caps. Estimates include preparation, recovery, and exercise transitions; real training time will vary. A short focused plan may be shorter than the available budget rather than add unnecessary volume.
- Start workout, individual set checkboxes, current movement/set, rest countdown, add 15 seconds, skip rest, and progress percentage.
- Completion summary, plan review, recovery prompts, and generate-another flow.
- Latest workout and set progress persist locally across refreshes. Timers use an absolute deadline, so returning after a backgrounded tab stays accurate. If storage is blocked, the current in-memory session still works, but cannot be restored after a reload.
- Helpful empty, loading, connection, invalid-input, and error states.
- The requested fitness-safety disclaimer and movement-specific safety cues. No medical approval claims, testimonials, or invented usage statistics.

## Project map

```text
src/app/
  page.tsx                         Landing page
  globals.css                      Tailwind entry + responsive design system
  layout.tsx                       Metadata, local fonts, shared layout
  workout/page.tsx                 Workout route
  api/generate-workout/route.ts     Validated server endpoint
src/components/
  builder/workout-builder.tsx       Five-step form + generation request
  workout/                         Workout session, cards, timer, completion
  ui/                              Logo, muscle illustrations, equipment icons
  header.tsx / hero.tsx / footer.tsx
src/lib/
  workouts/schema.ts               Shared Zod schemas and types
  workouts/exercises.ts            Authored exercise catalog and technique cues
  workouts/generator.ts            Local selection + server-side prescriptions
  workouts/storage.ts              Versioned local workout/progress persistence
  server/workout-service.ts        Server-only OpenAI adapter + fallback
  server/rate-limit.ts             Bounded per-instance request limiter
  utils.ts                         Shared utilities and safety disclaimer
public/
  fonts/                           Bundled fonts and SIL Open Font Licenses
  images/athlete-hero.webp          Optimized, AI-generated editorial hero
tests/
  generator.test.ts                All 3,780 preference combinations + invariants
  service.test.ts                  Mocked OpenAI success/fallback tests
  api.test.ts                      Response, validation, size, rate-limit tests
  e2e/workout.spec.ts               Desktop, phone, and iPhone WebKit workflows
  e2e/accessibility.spec.ts         Automated WCAG A/AA checks
```

## Tests and checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

For browser tests, keep the app running in another terminal (`npm run dev` or `npm start` after a build):

```bash
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

The browser suite covers selections, back navigation, equipment restrictions, invalid API requests, disabled tracking before start, rest controls, persisted progress, workout completion, the empty state, mobile navigation, and horizontal overflow. Tests are isolated with fresh browser contexts. Use `TEST_BASE_URL` to test a different running server.

```bash
npm run format
npm audit --omit=dev
```

### Verified during setup

- Optimized production build, strict TypeScript, and ESLint: passed.
- **80 unit/API tests** passed, including all **3,780** preference combinations and mocked AI success/failure paths.
- **12 browser tests** passed across desktop Chromium, phone-sized Chromium, and iPhone-profile WebKit.
- All five builder steps were checked at **320, 375, 390, 430, 700, 768, 1024, and 1440px** without horizontal overflow.
- Automated WCAG A/AA checks passed for the landing page, every builder step, and ready/active workout screens. This is an automated check, not an accessibility certification or a physical-iPhone test.
- `npm audit --omit=dev` reported **0 known production dependency vulnerabilities** at setup.

## API

`POST /api/generate-workout`, with `Content-Type: application/json`:

```json
{
  "bodyPart": "Chest",
  "equipment": "Dumbbells",
  "experience": "Beginner",
  "goal": "Muscle Growth",
  "duration": 45
}
```

Success returns `{ "workout": { ... } }`. Invalid values or extra fields return `400`; unsupported media types `415`; bodies over 4 KiB `413`; rate-limited requests `429` with `Retry-After`; unexpected generation failures `503`. Successful responses are not cached.

## Deployment notes

- API keys and the provider SDK stay in `server-only` modules, never client bundles.
- The request limiter is deliberately dependency-free, **per process / best effort**, not a production-wide quota. Before a public, paid-AI launch, use a shared rate-limit store and enforce provider spending limits; configure your hosting proxy to overwrite forwarded-IP headers. Authentication and abuse controls can be added based on your deployment's needs.
- No personal data or workout history is sent to OpenAI: only the five training selections and allowed exercise metadata. Workout and progress persistence are device-local, not cloud sync.
- Static assets and fonts are bundled, so the UI does not rely on third-party image/font CDNs.
- The generated hero is decorative campaign imagery, not a real member testimonial or an exercise demonstration.
- This is general fitness information, not an injury-rehabilitation, medical, or individualized professional training service. Bodyweight-only back/biceps sessions explicitly explain the limits of training without a pulling load.
