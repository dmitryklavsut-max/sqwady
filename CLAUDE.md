# CLAUDE.md — Instructions for Claude Code

## Project Context
Sqwady is a no-code AI startup OS. This is a Vite + React 19 + Tailwind CSS 4 project.
The original prototype was a single monolith file (src/MONOLITH_REF.jsx, ~35KB).
It has been scaffolded into a proper project structure with stub components.

## What's Done
- Project scaffolding (Vite, Tailwind, React Router)
- Landing page (src/pages/Landing.jsx)
- Project Setup page (src/pages/ProjectSetup.jsx)
- Workspace shell with tabs (src/pages/Workspace.jsx)
- Shared data constants (src/data/constants.js)
- Reusable Button component (src/components/Button.jsx)

## What Needs Implementation
Each stub component in src/components/ needs to be built. Reference src/MONOLITH_REF.jsx for the original logic.

### Priority Order:
1. **OfficeBuild.jsx** — Drag-and-drop office builder
   - Left sidebar: desk palette (12 roles) + people palette (6 avatars)
   - Center: 4x2 grid of desk slots
   - Drag desk → slot fills. Drag person → seat them. Click seated → config modal.
   - Config modal: name, bio, LLM model select, memory URL
   - Use @dnd-kit for drag-and-drop
   - "Запустить" button → passes team array to onDone prop

2. **ChatPanel.jsx** — Multi-channel messaging
   - Left: channel list (General, Engineering, Product, Standup) + team roster
   - Right: message feed + input with /task command
   - /task creates a kanban item (need shared state with KanbanBoard)

3. **KanbanBoard.jsx** — Task management
   - 5 columns: Backlog, To Do, In Progress, Review, Done
   - Drag-and-drop cards between columns (@dnd-kit)
   - Click card → edit modal (title, assignee, priority, column)
   - Filter by team member
   - Priority badges (P0-P3 color coded)

4. **RoadmapView.jsx** — Gantt timeline
   - 12-month horizontal timeline
   - 4 phase blocks positioned by start/duration
   - Hover shows milestone details

5. **EconomicsView.jsx** — Financial dashboard
   - KPI cards (ARR, Costs, Break-even, Users)
   - Revenue vs Costs bar chart (use Recharts)
   - Cumulative burn rate visualization

6. **CalendarView.jsx** — Monthly calendar
   - Standard monthly grid (Mon-Sun)
   - Today highlighted
   - Tasks from kanban shown on dates

7. **PitchStudio.jsx** — Slide deck editor
   - Left: slide list with thumbnails
   - Center: slide preview/editor (16:9 aspect ratio)
   - Toggle between preview and edit mode
   - Add new slides

8. **WikiView.jsx** — Knowledge base
   - Left: page list
   - Right: markdown-style content viewer/editor
   - Add new pages, edit existing

## Code Style Rules
- Use Tailwind CSS classes, minimize inline styles
- Use CSS variables (var(--bg), var(--ac), etc.) for theme colors
- Use Outfit font family (already loaded)
- Components receive data via props, not global state
- Keep animations: animate-fade-up, animate-pop classes
- Dark theme only (matching the monolith)
- Russian UI labels (matching the monolith)

## Key Libraries
- @dnd-kit/core, @dnd-kit/sortable — for drag and drop
- recharts — for charts in EconomicsView
- lucide-react — for icons (replace emoji icons gradually)
- react-router-dom — already configured in main.jsx

## Running
```bash
npm install
npm run dev     # → localhost:3000
npm run build   # → dist/
```
