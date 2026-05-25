<p align="center">
  <img src="https://img.shields.io/badge/JiraPulse-Enterprise-6C5CE7?style=for-the-badge&logoColor=white" alt="JiraPulse Enterprise" />
  <img src="https://img.shields.io/badge/Version-3.0.0-00B4D8?style=for-the-badge" alt="Version 3.0.0" />
  <img src="https://img.shields.io/badge/Employees-10%2C000%2B-00C9A7?style=for-the-badge" alt="10,000+ Employees" />
  <img src="https://img.shields.io/badge/License-MIT-FFB347?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">⚡ JiraPulse Enterprise</h1>

<p align="center">
  <strong>AI-Powered Productivity Analytics Platform for Large Organizations</strong>
  <br />
  Analyze team performance, sprint velocity, OKRs, capacity planning, and risk management across departments — all powered by Jira data.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 🎯 What is JiraPulse Enterprise?

JiraPulse Enterprise is a **high-end productivity analysis tool** designed for corporate organizations of **10,000+ employees**. It provides deep insights into team and individual performance through Jira stories, sprints, and agile metrics — enabling engineering leaders to make data-driven decisions at scale.

### Built For
- 🏢 **VP/Director of Engineering** — Org-wide delivery visibility
- 👥 **Engineering Managers** — Team health and capacity planning
- 📊 **Scrum Masters** — Sprint retrospectives and velocity tracking
- 🎯 **Product Leaders** — OKR alignment and delivery confidence

---

## ✨ Features

### 📊 Core Analytics
| Feature | Description |
|---------|-------------|
| **Executive Dashboard** | Org-wide KPIs, department performance cards, at-risk teams identification |
| **Employee Directory** | 120+ employees across 20 teams with department filtering and search |
| **Employee Deep-Dive** | Individual performance metrics, activity heatmaps, sprint velocity charts |
| **Leaderboard** | Weighted productivity scoring (completion, velocity, efficiency, consistency) |
| **Employee Comparison** | Side-by-side metric comparison with radar charts |

### 🏢 Enterprise Views
| Feature | Description |
|---------|-------------|
| **Sprint Retrospective** | Per-sprint deep dive with carry-over analysis, top contributors, and team breakdowns |
| **Capacity Planning** | Team utilization rates, planned vs available hours, capacity forecasting |
| **Risk & Blockers** | Aging blocked issues, dependency tracking, SLA breach indicators |
| **OKR & Goals** | Quarterly objectives with key results tracking tied to Jira delivery |
| **Team Analytics** | Cross-team benchmarking, velocity trends, health scores |

### 🛠️ Platform Features
| Feature | Description |
|---------|-------------|
| **Real-time Jira Sync** | FastAPI backend with live Jira Cloud integration |
| **Global Search** | `Ctrl+K` / `⌘K` command palette for employees and issues |
| **CSV/JSON/PDF Export** | Export any view's data in multiple formats |
| **Dark/Light Theme** | Full theme support with smooth transitions |
| **Responsive Design** | Mobile-first sidebar navigation, works on all devices |
| **Smart Notifications** | Automated alerts for blocked issues, low completion rates |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **npm** 9+
- (Optional) **Python** 3.10+ for the backend API

### Frontend Only (Demo Mode)
```bash
# Clone the repository
git clone https://github.com/imaakanksha/ProductivityAnalyzer.git
cd ProductivityAnalyzer

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open **http://localhost:5173** in your browser.

> 💡 The app runs with realistic mock data (120 employees, 20 teams, 8 departments) out of the box — no Jira connection required.

### With Backend (Live Jira Data)
```bash
# Set up the backend
cd backend
cp .env.example .env
# Edit .env with your Jira credentials

# Install Python dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload

# In another terminal, start the frontend
cd ..
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite)                    │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Dashboard │  │ Analytics│  │  Enterprise Views  │  │
│  │  Views    │  │  Charts  │  │  (Exec, OKR, Risk) │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                  │             │
│  ┌────┴──────────────┴──────────────────┴──────────┐ │
│  │              Data Layer (data.js)                │ │
│  │   120 Employees · 20 Teams · 8 Departments      │ │
│  │   12 Sprints · OKRs · Deterministic Mock Data   │ │
│  └─────────────────────┬───────────────────────────┘ │
└────────────────────────┼─────────────────────────────┘
                         │ API (optional)
┌────────────────────────┼─────────────────────────────┐
│              Backend (FastAPI)                         │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Jira    │  │ SQLite   │  │ Analytics Engine     │ │
│  │ Client  │  │ Cache    │  │ (Scoring, Metrics)   │ │
│  └─────────┘  └──────────┘  └──────────────────────┘ │
└───────────────────────────────────────────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JS (ES Modules) + Vite 8 |
| **Charts** | Chart.js 4.5 (line, bar, radar, doughnut) |
| **Styling** | Vanilla CSS with custom design system |
| **Typography** | Inter + JetBrains Mono (Google Fonts) |
| **Backend** | Python FastAPI + SQLite |
| **Jira Integration** | Jira Cloud REST API v3 |
| **Build** | Vite (241ms cold start, 216ms build) |

---

## 📁 Project Structure

```
ProductivityAnalyzer/
├── index.html                 # App shell with sidebar navigation
├── package.json               # Dependencies (chart.js, vite)
├── src/
│   ├── main.js                # App orchestrator, routing, event binding
│   ├── data.js                # Enterprise mock data (120 employees, OKRs)
│   ├── views.js               # Core views (dashboard, employees, sprints)
│   ├── features.js            # Leaderboard, comparison, workload, timeline
│   ├── enterprise.js          # Enterprise views (executive, retro, capacity, risk, OKR)
│   ├── charts.js              # 12 Chart.js renderers
│   ├── api.js                 # Backend API client with fallback
│   └── style.css              # Complete design system (415 rules)
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI server
│   │   ├── jira_client.py     # Jira Cloud integration
│   │   ├── database.py        # SQLite ORM
│   │   ├── analytics.py       # Scoring & metrics engine
│   │   ├── schemas.py         # Pydantic models
│   │   ├── config.py          # Environment config
│   │   ├── seed.py            # Database seeder
│   │   └── routers/           # API route handlers
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment template
└── dist/                      # Production build output
```

---

## 📈 Data Model

### Organizational Hierarchy
```
Enterprise (10,000+ employees)
├── 8 Departments (Platform, Product, Cloud, Data, QA, Security, Mobile, AI/ML)
│   ├── 20 Teams (2-3 per department)
│   │   └── 6 Members each (120 total in demo)
│   │       ├── Level: L3 → L6+
│   │       ├── Role: Engineer → Director
│   │       └── Manager relationship
```

### Metrics Computed
- **Productivity Score** — Weighted composite (completion 35%, velocity 25%, efficiency 20%, consistency 20%)
- **Sprint Velocity** — Story points delivered per sprint
- **Completion Rate** — Issues done vs committed
- **Efficiency** — Estimated vs logged hours ratio
- **Health Score** — Team-level composite metric
- **Cycle Time** — Average days per issue resolution

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| **Primary BG** | `#0a0b10` (dark) / `#f5f6fa` (light) |
| **Accent** | `#6C5CE7` (purple) |
| **Cyan** | `#00B4D8` |
| **Green** | `#00C9A7` |
| **Amber** | `#FFB347` |
| **Rose** | `#FF6B8A` |
| **Font** | Inter 300–900, JetBrains Mono |
| **Radius** | 8px (sm), 12px (default), 16px (lg) |

Features glassmorphism, ambient orb animations, and micro-interactions throughout.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/imaakanksha">Aakanksha</a>
  <br />
  <sub>JiraPulse Enterprise v3.0.0 · Designed for scale</sub>
</p>
