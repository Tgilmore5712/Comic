# Inkforge Studio

Inkforge Studio is a continuity-first comic book creator built with Next.js. It keeps story rules, character voice, long-form arcs, issue outlines, and panel-level continuity notes in one workspace so you can develop a series without losing consistency.

## What is included

- A polished editorial dashboard for comic development
- A series bible with editable story rules and hook
- A character bible focused on voice, goals, fears, and recurring details
- Arc tracking for long-form plotlines
- An issue room with beat sheets and panel planning
- A continuity radar that warns about missing structure or character anchors
- Browser persistence with `localStorage` so edits survive refreshes locally
- JSON export and import for moving story bibles between machines or checkpoints
- A local writers-room assist that generates an issue pass from the current story bible
- An optional API-backed writers-room assist using any OpenAI-compatible provider, with local fallback
- Prompt-pack export for sending issue-ready panel prompts to external image tools at low cost
- A style-guide layer that tunes both story generation and exported prompt packs
- Provider presets for cheap model routing without editing code
- Panel image slots for attaching generated or approved art back to each panel
- Prompt review mode that flags continuity or export-risk issues before handoff
- Gallery view that groups attached panel art by issue and page
- Revision history for each panel image slot
- One-click bundled export that combines handoff script, prompt pack, and attached images

## Getting started

Install dependencies if needed:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in a browser.

## Working with projects

- Use `Export JSON` in the series capsule to download the current comic project.
- Use `Import JSON` to restore a previously exported Inkforge project file.
- Use `Writers room assist` in the issue room to generate a hook, theme, summary, beats, and starter panel notes for the active issue.
- Use `Export prompt pack` to generate panel-by-panel image prompts from the active issue and continuity notes.
- Use the story bible `Style guide` fields to lock visual language before generating scripts or prompts.
- Use the `AI provider` controls to choose a cheap preset or add a model override.
- Use `Review prompt pack` before export to catch continuity or asset gaps.
- Use each panel `Image slot` to attach approved art, track status, and save notes.
- Use `Open gallery` to review attached art grouped by issue and page.
- Use `Save revision` on a panel to snapshot the current image, notes, and status before making changes.
- Use `Export bundle` to download a single issue package containing the handoff, prompt pack, and attached images.

The assist feature is local and deterministic. It does not require an external model API, and it stays constrained by the current character voices, goals, rules, and open arcs.

## Recommended low-cost workflow

For the best power-to-cost ratio, use Inkforge as the main editor and planning system:

1. Build the story bible, cast bible, arcs, and issues inside the editor.
2. Use `Writers room assist` to draft or redraft issues while preserving continuity.
3. Export the handoff or prompt pack for downstream art generation.
4. Use any cheap or free external image tool for panel art instead of locking the app to one expensive image stack.

This repo is now organized around that editor-first workflow. The shared continuity engine lives in `src/lib/comic-engine.ts`, and both the browser UI and the `/api/generate-issue` route use the same story logic.

## Low-cost AI setup

If you want stronger generation without changing the app architecture, configure an OpenAI-compatible API in `.env.local`.

Start from `.env.example` and set:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4.1-mini
OPENAI_SITE_URL=https://your-production-domain.example
OPENAI_SITE_NAME=Inkforge Studio
OPENAI_TIMEOUT_MS=45000
```

That setup gives you a concrete low-cost provider path out of the box. You can still point `OPENAI_BASE_URL` at any other compatible provider. The app upgrades `Writers room assist` from local generation to server-backed generation when configured, and falls back automatically if the provider is unavailable.

## Production AI environment variables

For a hosted deployment, configure these server-side environment variables in your platform dashboard instead of committing secrets:

- `OPENAI_API_KEY`: required to enable remote writers-room assist.
- `OPENAI_BASE_URL`: optional override for any OpenAI-compatible provider endpoint.
- `OPENAI_MODEL`: optional default model if you do not want to rely on preset defaults.
- `OPENAI_SITE_URL`: optional site URL header for providers such as OpenRouter.
- `OPENAI_SITE_NAME`: optional app name header for provider attribution.
- `OPENAI_TIMEOUT_MS`: optional request timeout in milliseconds before the API route falls back to the local continuity engine.

For Vercel specifically:

1. Open the project settings for your deployed site.
2. Add the variables above under `Environment Variables` for `Production`.
3. Redeploy so the server route picks up the new values.

Do not expose these as `NEXT_PUBLIC_*` variables. The AI key is only needed by the server route in `src/app/api/generate-issue/route.ts`.

## Prompt tuning

Inkforge now pushes the style guide through both the server prompt and the exported prompt pack. That means your issue planning and downstream panel-image prompts stay aligned on:

- visual style
- linework
- color mood
- camera language
- lettering direction
- reference notes for consistency

## Editor workflow additions

- `AI provider`: choose a cheap preset such as OpenRouter or Groq-compatible routing without changing application code.
- `Review prompt pack`: shows warnings and infos before you export prompts for downstream image generation.
- `Image slot`: each panel now stores an image URL or uploaded preview, a status (`Planned`, `Generating`, `Ready`), and production notes.
- `Gallery view`: scans the whole project for attached panel art and presents it grouped by issue and page.
- `Revision history`: lets you keep multiple image attempts per panel and restore an older one.
- `Bundle export`: creates a single self-contained issue package for handoff or review.

## Validation

The current setup has been verified with:

```bash
npm run lint
npm run build
```

## Tech stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS 4

## Likely next steps

1. Add project export and import for JSON story bibles.
2. Persist projects in a real database instead of browser storage.
3. Add AI-assisted beat generation constrained by the character bible.
4. Add printable page and panel templates for artist handoff.
