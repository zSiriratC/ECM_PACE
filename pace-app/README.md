# PACE – Intelligence Construction Application

> **MPA + React-islands** architecture on a **Flask** shell with
> **React + TypeScript** islands and a **shared design-system** package.

## Architecture decisions

| Decision | Reason |
|---|---|
| MPA + React islands | Max team isolation; each feature is its own bundle/folder |
| React + TS | Design system is React; ag-grid / react-flow / chart.js are React-first |
| Flask serves shell + API | One service, server-side auth + sessions, simplest ops |
| Shared design-system | One source of UI truth; update once, consume everywhere |

## Folder structure

```
PACE/
├── app/                        # Flask back-end
│   ├── __init__.py             # create_app factory
│   ├── config.py               # Configuration
│   ├── models.py               # SQLAlchemy models
│   ├── pages.py                # Page (shell) routes
│   ├── api/                    # REST API blueprints
│   │   ├── planning.py
│   │   ├── daily_report.py
│   │   ├── dashboard.py
│   │   ├── timesheet.py
│   │   ├── actual.py
│   │   └── setup.py
│   ├── templates/              # Jinja2 HTML shells
│   │   ├── base.html
│   │   ├── planning.html
│   │   ├── daily_report.html
│   │   ├── dashboard.html
│   │   ├── timesheet.html
│   │   ├── actual.html
│   │   └── setup.html
│   └── static/
│       ├── css/main.css
│       └── js/                 # ← webpack outputs here
│
├── frontend/                   # React + TS source
│   ├── design-system/          # Shared UI components
│   │   ├── index.ts
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── DataTable.tsx
│   │   ├── Layout.tsx
│   │   ├── Modal.tsx
│   │   └── Sidebar.tsx
│   ├── islands/                # One folder per page
│   │   ├── planning/index.tsx
│   │   ├── daily-report/index.tsx
│   │   ├── dashboard/index.tsx
│   │   ├── timesheet/index.tsx
│   │   ├── actual/index.tsx
│   │   └── setup/index.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js
│
├── run.py
├── requirements.txt
├── .env.example
└── .gitignore
```

## Quick start

```bash
# 1 – Clone
git clone https://github.com/nathachoknamwong/PACE.git
cd PACE

# 2 – Python env
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3 – Frontend build
cd frontend
npm install
npm run build              # outputs bundles to ../app/static/js/
cd ..

# 4 – Run
cp .env.example .env
python run.py
# open http://localhost:5000
```

## Dev workflow

```bash
# Terminal 1 – Flask
python run.py

# Terminal 2 – Webpack watch
cd frontend && npm run dev
```

## License

MIT © 2026 nathachoknamwong
