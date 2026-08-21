# Suode

A localhost-first football research workspace. Phase 1 contains the Next.js,
TypeScript, and Tailwind application foundation plus a responsive dashboard
shell for research, fixtures, tickets, and history.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Local configuration

Copy the example environment file and add your API-Football key:

```bash
cp .env.example .env.local
```

```env
API_FOOTBALL_KEY=your_key_here
```

The key remains server-only. `.env.local` is ignored by Git, and the status
endpoint reports only whether the key is configured—it never returns the key.

## Current scope

- Responsive desktop and mobile application shell
- Research prompt interface with quick strategies
- Fixture signal preview cards
- Local-mode and privacy indicators
- Navigation foundation for planned product areas

The fixture values currently shown are clearly labelled preview data. Live
sports data and calculated probabilities will be added in Phase 2.
