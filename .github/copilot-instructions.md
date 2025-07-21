# AI Agent Instructions for MYNAB (Maybe You Need A Budget)

This is a personal budgeting application built with FastAPI backend and React frontend, supporting multi-currency transactions and bank statement imports.

## Project Architecture

### Backend (FastAPI)
- Location: `app/service/`
- Core Components:
  - `auth_user/`: Authentication and user management
  - `budget/`: Transaction and budget management
  - `mail/`: Email service for notifications
  - `budget_transaction_category/`: Transaction categorization
- Database: PostgreSQL with async SQLAlchemy
- Uses Alembic for migrations

### Frontend (React)
- Location: `app/client/`
- Key Features:
  - Multi-currency support
  - Bank statement import
  - Transaction categorization
  - Dashboard with financial summaries
  - PWA support with service worker
  - Theme system (light/dark) with system preference sync

## Development Workflow

### Backend Setup
```bash
cd app/service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup
```bash
cd app/client
npm install
npm run dev
```

### Database Migrations
```bash
cd app/service
alembic revision --autogenerate -m "Migration message"
alembic upgrade head
```

## Key Patterns & Conventions

### API Structure
- RESTful endpoints under `/budget`, `/auth`, `/mail`
- Standard response format: `{ data, error, metadata }` 
- Error handling through custom exceptions (`BadRequest`, `PermissionDenied`, etc.)
- Request validation using Pydantic models

### Authentication Flow
- Uses passwordless authentication (email codes)
- JWT tokens for session management
- Role-based access control through `require_role` dependency

### Data Flow
1. Frontend state management in `MainApp.jsx`
2. API requests through `services/api.jsx`
3. Backend routers -> services -> database layer
4. Transaction data includes amount, currency, type (income/outcome), category

### Transaction Categories
- Categories defined in `budget_transaction_category/constants.py`
- Automatic categorization on import via `identify_transaction_category()`

### Bank Statement Processing
- Supported formats: ICBC, Santander Rio, MercadoPago
- Import workflow: 
  1. Upload file (`/budget/import-file`)
  2. Process based on bank format
  3. Filter unwanted transactions
  4. Auto-categorize entries
  5. Save to database

## Common Operations
- User profile updates: `POST /auth/profile`
- Transaction summary: `GET /budget/summary`
- Currency-specific views: `GET /budget/summary-by-currency`
- Statement import: `POST /budget/import-file`
- File management: `GET /budget/files`

## Configuration
- Environment variables through `.env` file
- Mail service config via `ENV_MAIL_*` variables
- Database URL via `ENV_DATABASE_URL`
- CORS settings through `ENV_CORS_*` variables

## UI Design System

### Responsive Design Principles
- Mobile-first approach using Tailwind breakpoints
- Adaptive layouts for different screen sizes:
  - Stack layouts on mobile (`flex-col` to `flex-row`)
  - Compact text on small screens (`text-sm` to `text-base`)
  - Full-width containers on mobile (`w-full`)
  - Responsive padding and margins (e.g., `p-3 sm:p-6`)
- Responsive UI components in `components/ui/`
- Consistent spacing using Tailwind's scale

### Theme and Color System
- Defined in `app/client/src/index.css`
- CSS variables for consistent theming:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 210 15% 15%;
  --card: 0 0% 100%;
  --muted: 210 20% 96%;
  --accent: 142 75% 35%;
  --positive: 142 75% 35%;
  --destructive: 0 84% 65%;
}
```
- Use hsl() syntax for colors
- Financial color coding:
  - Positive values: Green (`--positive`)
  - Negative values: Red (`--destructive`)
  - Muted text: Gray (`--muted-foreground`)
  - Charts: Custom palette (`--chart-1` through `--chart-5`)
- Dark mode support with system preference sync
- Enhanced accessibility with focus states and contrast ratios
