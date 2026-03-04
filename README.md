# FinMate — Angular 20 Frontend

Modern personal finance management frontend for the FinMate application. Built with Angular 20, TailwindCSS, and Chart.js.

## Tech Stack

- **Framework**: Angular 20 (standalone components)
- **Styling**: TailwindCSS 4
- **Charts**: Chart.js + ng2-charts
- **Language**: TypeScript 5.8
- **Build**: Angular CLI / esbuild

## Project Structure

```
angular-front/src/app/
├── components/
│   ├── auth/
│   │   ├── login.ts          # Login page (email/password + Google OAuth)
│   │   └── register.ts       # Registration page
│   ├── layout/
│   │   ├── top-navbar.ts     # Top navigation bar
│   │   ├── bottom-nav.ts     # Bottom navigation (5 tabs)
│   │   └── main-layout.ts    # Page layout wrapper
│   ├── dashboard/
│   │   └── dashboard.ts      # Main dashboard with balance, assets, quick actions
│   ├── stocks/
│   │   └── stocks.ts         # Stock portfolio, holdings, trending
│   ├── crypto/
│   │   └── crypto.ts         # Crypto portfolio, holdings, trending
│   ├── pfm/
│   │   └── pfm.ts            # Personal finance (overview, transactions, goals)
│   └── ai/
│       └── ai.ts             # AI assistant chat interface
├── guards/
│   └── auth.guard.ts         # Route protection
├── interceptors/
│   └── auth.interceptor.ts   # JWT token injection
├── models/
│   └── api.models.ts         # TypeScript interfaces for API responses
├── services/
│   ├── auth.service.ts       # Authentication, token management
│   └── api.service.ts        # All API calls to the backend
├── app.routes.ts              # Routing with lazy loading
├── app.config.ts              # App providers (HTTP, router, interceptors)
├── app.ts                     # Root component
└── app.html                   # Root template
```

## Pages

| Route | Component | Description |
|-------|-----------|-------------|
| `/auth/login` | LoginComponent | Sign in with email/password or Google |
| `/auth/register` | RegisterComponent | Create new account |
| `/dashboard` | DashboardComponent | Total balance, assets overview, quick actions |
| `/stocks` | StocksComponent | Stock portfolio, holdings list, trending stocks |
| `/crypto` | CryptoComponent | Crypto portfolio, holdings list, trending crypto |
| `/pfm` | PfmComponent | Financial overview, transactions, goals (tabbed) |
| `/ai` | AiComponent | AI financial assistant chat |

## Design

- **Theme**: Dark mode with gradient backgrounds (`gray-900` → `black` → `gray-800`)
- **Accent color**: `#00FF88` (green)
- **UI style**: Glassmorphic cards, backdrop blur, rounded corners
- **Navigation**: Bottom tab bar (mobile-first), top navbar with search/notifications/avatar
- **Typography**: System sans-serif font stack

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Angular CLI](https://angular.dev/) (`npm install -g @angular/cli`)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
ng serve
```

The app runs at `http://localhost:4200`.

## Build

```bash
# Production build
ng build

# Output is in dist/angular-front/
```

## Backend Connection

The frontend connects to the ASP.NET API at `http://localhost:5100`. Make sure the backend is running before using the app.

## Default User

After starting both backend and frontend:

- **Email**: `john.doe@example.com`
- **Password**: `Test123!`
