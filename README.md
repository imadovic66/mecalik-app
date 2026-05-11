# MecaLIK

On-demand mobile mechanic platform for Casablanca. Book a certified technician to come to you — oil changes, battery replacements, diagnostics, tyre services, car washes, and 24/7 emergency roadside assistance.

## Tech stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Framework    | React 18 + TypeScript + Vite            |
| Styling      | Tailwind CSS + inline styles            |
| Routing      | React Router v6                         |
| Backend      | Supabase (Postgres + Auth + Realtime)   |
| i18n         | react-i18next (fr / en)                 |
| Charts       | Recharts                                |
| Icons        | Lucide React                            |
| Push notifs  | Web Push API via `/api/notify`          |
| Deployment   | Vercel                                  |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build
npx tsc --noEmit   # type check
```

Environment variables (`.env.local`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Project structure

```
src/
├── components/
│   ├── home/              # Landing page sections (Hero, Stats, Services, …)
│   └── ui/                # Shared UI components (LanguageSwitcher, …)
├── data/
│   └── pricing.ts         # Service catalogue with zone-based pricing
├── hooks/                 # useAuth, usePushNotifications, …
├── lib/
│   ├── constants.ts       # App-wide magic values (WhatsApp URL, status colours, …)
│   ├── supabase.ts        # Supabase client
│   ├── types.ts           # Shared TypeScript interfaces (Booking, Profile, Car)
│   └── utils.ts           # Pure helpers (formatDate, buildWhatsAppMessage, …)
├── pages/
│   ├── admin/
│   │   ├── AdminDashboard.tsx   # Thin orchestrator (sidebar + modal + tab routing)
│   │   ├── adminShared.tsx      # Types, STATUS_CONFIG, StatusPill shared by tabs
│   │   └── tabs/                # One file per admin tab
│   │       ├── OverviewTab.tsx
│   │       ├── ReservationsTab.tsx
│   │       ├── ClientsTab.tsx
│   │       ├── FinancesTab.tsx
│   │       ├── ReviewsTab.tsx
│   │       └── NotificationsTab.tsx
│   └── Home.tsx           # Thin orchestrator for landing page sections
└── utils/
    └── whatsappNotify.ts  # WhatsApp deep-link message builder
```

## Booking status flow

```
pending → confirmed → on_the_way → in_progress → completed
                 └─────────────────────────────→ cancelled
```

Status transitions from the admin dashboard automatically send a WhatsApp notification and a push notification to the customer.

## Services

| Service     | Typical duration |
|-------------|-----------------|
| Lavage      | ~45 min         |
| Vidange     | ~60 min         |
| Batterie    | ~30 min         |
| Pneus       | ~45 min         |
| Diagnostic  | ~30 min         |
| Urgence     | ASAP            |
