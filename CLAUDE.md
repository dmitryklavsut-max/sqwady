# Sqwady — AI Startup Operating System

## Overview
No-code OS for AI startups. Users create a project, assemble a team of AI agents,
and agents autonomously work on implementation — writing code, designing architecture,
planning roadmaps, preparing pitch decks, and maintaining documentation.

## Architecture
- **Framework:** Vite + React 19 + Tailwind CSS 4 + React Router 7
- **State:** AppContext (React Context + useReducer + localStorage persistence)
- **AI:** Anthropic API (Claude Sonnet/Opus/Haiku) with mock fallback
- **Deployment:** Vercel at sqwady-app.vercel.app
- **API Proxy:** Vercel serverless functions in /api/ (for CORS)
- **Landing page:** SEPARATE project on Cloudflare Pages at sqwady.com — DO NOT TOUCH

## App Flow
```
Landing → ProjectSetup (3 screens) → OfficeBuild → GenerationScreen → Workspace (7 modules)
```

## State Structure (AppContext)
```
{
  project: { name, description, industry, stage, audience, businessModel,
             pricing, market, competitors, advantage, productType, techStack,
             mvpFeatures, timeline, budget },
  team: [{ id, role, label, icon, color,
           position: { functions, responsibilities, interactions, metrics },
           personality: { name, gender, age, avatar, experience, skills,
                         background, strengths, weaknesses, temperament,
                         communicationStyle, approach },
           model, temperature, systemPrompt }],
  tasks: [{ id, title, description, assignee, priority, column, tags,
            dueDate, createdAt, reassignCount, returnCount }],
  messages: { general: [], eng: [], prod: [], stand: [], meeting: [] },
  roadmap: [{ id, phase, color, start, duration, items }],
  economics: { months, revenue, costs, users },
  pitchSlides: [{ title, icon, text }],
  wikiPages: [{ title, icon, text }],
  memoryFiles: { PROJECT, ARCHITECTURE, TEAM_CONTEXT, DECISIONS, PROGRESS,
                 agents: { [agentId]: { position, personality, systemPrompt, memory, decisions } } },
  recommendations: { businessModel, competitors, techStack, teamComposition, agentDefaults }
}
```

## File Structure
```
src/
├── context/
│   └── AppContext.jsx          # Shared state + localStorage persistence
├── services/
│   └── ai.js                  # Anthropic API: recommendations, generation, chat
├── pages/
│   ├── Landing.jsx             # In-app welcome screen (NOT marketing page)
│   ├── ProjectSetup.jsx        # 3-screen wizard (Project → Business → Tech)
│   └── Workspace.jsx           # Sidebar layout + module routing
│   └── GenerationScreen.jsx    # Loading screen between OfficeBuild → Workspace
├── components/
│   ├── OfficeBuild.jsx         # Drag-drop office + 2-layer agent config
│   ├── ChatPanel.jsx           # AI chat, /task, @mentions, channels
│   ├── KanbanBoard.jsx         # 5 columns, CRUD, drag-drop, filters
│   ├── RoadmapView.jsx         # Gantt timeline, editable
│   ├── EconomicsView.jsx       # KPIs + Recharts charts
│   ├── CalendarView.jsx        # Monthly grid with tasks
│   ├── PitchStudio.jsx         # Slide editor
│   └── WikiView.jsx            # Knowledge base editor
├── data/
│   └── constants.js            # Roles, models, channels, kanban columns
├── styles/
│   └── index.css               # Tailwind + CSS variables
├── App.jsx                     # Main router wrapped in AppProvider
├── main.jsx                    # Entry point with BrowserRouter
├── MONOLITH_REF.jsx            # Original prototype (reference only)
└── DESIGN_REF.html             # Stitch design (reference only)
```

## Two-Layer Agent Architecture

### Layer 1 — Position (Desk/Role)
Defines WHAT the agent does. Generated from role + project data.
- Job functions, responsibilities
- Who they interact with (receives tasks from / sends to)
- Active workspace modules
- Success metrics

### Layer 2 — Personality (Person)
Defines WHO the agent is. AI recommends, user customizes.
- Name, gender, age, avatar
- Experience level, key skills, background
- Temperament, communication style, approach
- Strengths and weaknesses

### Result: System Prompt = Position + Personality + Project Context

## Memory Files

### Project-level (5 files)
- PROJECT.md — project passport (all Setup data)
- ARCHITECTURE.md — technical description (AI generated)
- TEAM_CONTEXT.md — team composition and responsibilities
- DECISIONS.md — decision log (filled during work)
- PROGRESS.md — project progress (filled during work)

### Per-agent (5 files each)
- {agent}_position.md — job description (Layer 1)
- {agent}_personality.md — identity and skills (Layer 2)
- {agent}_system_prompt.md — final prompt (Layer 1 + 2 + context)
- {agent}_memory.md — personal memory (what they did, learned)
- {agent}_decisions.md — agent's decisions

## AI Service (src/services/ai.js)

### Functions
1. `generateRecommendations(project)` — after screen 2.1, returns hints for all fields
2. `generateWorkspaceContent(project, team)` — generates tasks, roadmap, slides, wiki, messages, memory files
3. `chatWithAgent(agent, message, context)` — AI response in character
4. All functions have mock fallback when no API key

### API Configuration
- Env var: VITE_ANTHROPIC_API_KEY
- Model: claude-sonnet-4-20250514
- Proxy: /api/recommend.js, /api/chat.js (Vercel serverless)
- .env in .gitignore, .env.example committed

## Key Libraries
- @dnd-kit/core, @dnd-kit/sortable — drag and drop
- recharts — charts in Economics
- lucide-react — icons
- react-router-dom — navigation

## Coding Rules
- All modules read/write via useApp() hook — NEVER local-only state for shared data
- Tailwind CSS classes preferred, minimize inline styles
- CSS variables for theme colors (var(--bg), var(--ac), etc.)
- Russian UI labels throughout
- Dark theme by default
- Semantic HTML: <nav>, <main>, <aside>, <button>
- Min font size: 12px anywhere
- Every interactive element: visible focus ring

## Workflow Rules
- ONE feature per Claude Code session
- /compact at 50% context usage
- /clear between different tasks
- Always run `npm run build` before committing
- Commit message format: "Phase N: description"
- Always push after commit: `git push origin main`
- Test in browser after each phase

## Completed Releases

### v0.1 Core
- AppContext + localStorage persistence
- ProjectSetup 3 screens + AI hints
- OfficeBuild 2-layer agents + AI team recommendation
- Generation screen + workspace content
- Chat with AI agents (/task, @mentions, role display)
- Kanban full CRUD + drag-drop
- Roadmap + Economics + Calendar (AI generated + editable)
- Pitch + Wiki (AI generated + editable)
- Memory files (5 project + 5 per agent)
- ProjectsHub + TeamsHub (multi-project support)
- Clickable agent profiles in sidebar

### v0.2 Full Autonomy
- Heartbeat Engine (manual + auto triggers, pause/resume)
- Chain Reaction (task completion → dependent agents activated)
- Sprint System (auto-planning from Roadmap, progress tracking)
- Meeting Room (5 meeting types, multi-agent discussions, decisions log)
- Watchdog (6 health checks, severity levels, auto-resolve)
- Circuit Breaker (task limits, CEO arbitration, escalation modal, task freeze)
- Real Task Execution (agents produce artifacts, auto-review pipeline)
- Agent Plan Mode (execution plan + minute-based time estimates)
- GitHub Integration (auto-commit artifacts, connection settings)
- Claude Code Prompt Generator (for complex multi-file tasks)
- Notifications system (toasts for events)

## Current Release: v0.3 Economics (next)
Phase order:
18. Token Economics — agent salaries, project budget
19. Dynamic Hiring — CEO initiates, user approves
20. Budget optimization recommendations
21. Pricing tiers integration (Free/Pro/Team)

## Future: v0.4 Platform
- Integration Router
- External skills + sandbox
- External agents (MCP, CrewAI)
- Real people in team
