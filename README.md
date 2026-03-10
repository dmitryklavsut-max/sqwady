# Sqwady — AI Startup Operating System

No-code AI startup OS. Visual office builder + 7 workspace modules.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Project Structure

```
sqwady/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/          # UI components
│   │   ├── Button.jsx       # Reusable button
│   │   ├── OfficeBuild.jsx  # Drag-and-drop office builder ← TODO
│   │   ├── ChatPanel.jsx    # Multi-channel chat ← TODO
│   │   ├── KanbanBoard.jsx  # 5-column task board ← TODO
│   │   ├── RoadmapView.jsx  # 12-month Gantt chart ← TODO
│   │   ├── EconomicsView.jsx # Financial dashboard ← TODO
│   │   ├── CalendarView.jsx # Monthly calendar ← TODO
│   │   ├── PitchStudio.jsx  # Slide deck builder ← TODO
│   │   └── WikiView.jsx     # Knowledge base ← TODO
│   ├── data/
│   │   └── constants.js     # Shared data (roles, models, channels, etc.)
│   ├── pages/
│   │   ├── Landing.jsx      # Hero landing page ✅
│   │   ├── ProjectSetup.jsx # Step 1: project config ✅
│   │   └── Workspace.jsx    # Tab-based workspace shell ✅
│   ├── styles/
│   │   └── index.css        # Tailwind + custom theme
│   ├── App.jsx              # Main router ✅
│   └── main.jsx             # Entry point ✅
├── index.html
├── package.json
├── vite.config.js
└── CLAUDE.md                # Instructions for Claude Code
```

## Tech Stack

- **React 19** + Vite 6
- **Tailwind CSS 4** (utility-first)
- **@dnd-kit** (drag and drop)
- **Recharts** (charts in Economics)
- **Lucide React** (icons)
- **React Router 7** (navigation)

## User Flow

1. **Landing** → "Начать"
2. **Project Setup** → name + description
3. **Office Builder** → drag desks + seat AI employees + configure
4. **Workspace** → 7 tabs (Chat, Kanban, Roadmap, Economics, Calendar, Pitch, Wiki)

## Monolith Reference

The original monolith is in `src/MONOLITH_REF.jsx` — use this as the source of truth for all component logic. Each stub component in `src/components/` needs to be implemented by extracting the corresponding section from the monolith.

## Domain

- Website: https://sqwady.com
- Brand: Sqwady — "Build your AI squad"
