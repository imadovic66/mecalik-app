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
│   ├── home/                    # Landing page sections
│   │   ├── HeroSection.tsx      # Hero headline, CTA, mechanic photo
│   │   ├── ServicesSection.tsx  # 6 service cards grid
│   │   ├── HowItWorksSection.tsx
│   │   ├── ReviewsSection.tsx   # Customer reviews + live activity
│   │   └── CtaSection.tsx       # Bottom WhatsApp CTA
│   └── ui/
│       ├── BookingModal.tsx     # 3-step booking flow (service → form → confirm)
│       ├── Navbar.tsx
│       └── WhatsAppFAB.tsx      # Floating WhatsApp button
├── hooks/
│   └── usePushNotifications.ts
├── lib/
│   ├── constants.ts   # WHATSAPP_NUMBER, BOOKING_STATUSES, STATUS_COLORS, SERVICE_PRICES
│   ├── sanitize.ts    # Input sanitization (strips HTML, limits length)
│   ├── supabase.ts    # Supabase client (anon key from env vars)
│   ├── types.ts       # TypeScript interfaces: Booking, Profile, Car, BookingFormData
│   └── utils.ts       # getStatusColor, formatDate, generateReference, buildWhatsAppMessage
├── locales/
│   ├── fr.json        # French translations
│   └── en.json        # English translations
└── pages/
    ├── admin/
    │   ├── AdminDashboard.tsx   # Shell: auth check, data fetch, tab nav
    │   └── tabs/
    │       ├── OverviewTab.tsx      # KPIs, revenue chart, recent activity
    │       ├── ReservationsTab.tsx  # Bookings table, status/mechanic updates
    │       ├── ClientsTab.tsx       # Profiles list
    │       ├── FinancesTab.tsx      # Financial dashboard, B2B/B2C, transactions
    │       ├── ReviewsTab.tsx
    │       └── NotificationsTab.tsx
    ├── auth/
    │   ├── Login.tsx
    │   └── Signup.tsx
    ├── dashboard/
    │   └── CustomerDashboard.tsx    # Client portal (bookings, cars, profile)
    ├── fleet/
    │   └── FleetDashboard.tsx       # Fleet manager portal
    ├── mechanic/
    │   └── MechanicDashboard.tsx    # Mechanic job board + status actions
    ├── Home.tsx                     # Landing page orchestrator
    └── TrackBooking.tsx             # Guest booking tracker (no login required)
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
