# Unified Lost & Found — Westfield University
**MVP: Option A — Snap & Notify** · v1.1.0

A full-featured campus lost-and-found web app built with **Vite + React + Tailwind CSS**.

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production dist/
npm run preview    # preview production build
```

---

## Feature Overview

### 🔐 Login (Mock SSO)
- Three demo accounts: Student (James), Student/Finder (Priya), Admin (Security Desk)
- Switch users at any time via the avatar dropdown in the navbar
- In production: replace with Azure AD / Google Campus SSO

### 🏠 Home Dashboard — Bento Grid
- **Hero card** with live stats (unclaimed count, claims today, match speed)
- **Finds Nearby** — horizontal scroll of recent items, match-indicator dots on relevant items
- **My Active Reports** — open LIRs with live match score badges
- **Quick Search** — keyword chips, direct search bar
- **Quick stats row** — 4 metric cards

### 📸 Finder Upload Flow — 4 Steps (PRD §3.1)
1. **CameraCapture** — live viewfinder (getUserMedia), drag-and-drop upload, demo mode
2. **AI Analysis** — animated scanning state (~2s mock), parallel tag generation
3. **TagReview** — confidence-colour chips (green/amber/red), inline rename, add/remove, custom tags
4. **LocationPicker** — building dropdown, floor selector, zone free-text, timestamp picker
5. **SubmitConfirmation** — item ID badge, match alert with score, "what happens next" timeline

### 🔍 Owner Search (PRD §3.2 / §3.3)
- Debounced full-text search via `useSearch` hook (250ms)
- Category filter tabs with live counts
- **Advanced filter panel** — status, building, date range, sort order
- Pagination (12 per page)
- **Blurred item cards** — photos locked until ownership verified
- **ItemDetailModal** — tabbed (Details / Claim / Timeline)
  - **ClaimForm** — verification question gate, pass/fail/manual review
  - **StatusTimeline** — 7-step progress tracker
- **"Report lost item" button** — inline **LIRForm** with notification prefs

### 🛡 Admin Dashboard (PRD §3.4)
- 4 metric cards with delta indicators
- **Items tab** — filterable table, approve/reject buttons, expiry countdowns
- **Claims tab** — `ClaimQueue` with master/detail side panel, full claim context
- **Expiry tab** — `PurgePanel` bulk select → Purge / Donate / Extend actions

---

## Architecture

```
src/
  store/
    itemStore.jsx         Context + useReducer: add, updateStatus, purge, extend
    lirStore.jsx          Context + useReducer: addLir, updateStatus, addMatch
    userStore.jsx         Mock auth: 3 demo users, switchUser
  services/
    matchEngine.js        scoreMatch(), findMatches(), getBestScoreForItem()
    visionApi.js          Mock analyseImage() + buildTagsFromResult()
    notificationService   ToastStack, push/dismiss queue, success/error/match helpers
    utils.js              timeAgo, searchItems, colourHex, formatDate, generateId
  hooks/
    useCamera.js          Browser getUserMedia + captureFrame
    useSearch.js          Debounced filter/sort/paginate hook
    useMatchAlert.js      Watches items, fires onMatch for new matches
    useAuth.js            Shorthand for useUserStore
  components/
    ui/                   Navbar, FAB, BlurredPhoto, StatusBadge, TagChip, ColourDots,
                          MatchScoreBadge, EmptyState, SectionLabel, Skeleton, ToastStack
    finder/               CameraCapture, TagReview, LocationPicker, SubmitConfirmation
    owner/                ItemDetailModal, ClaimForm, StatusTimeline, LIRForm
    admin/                ClaimQueue, PurgePanel
  pages/
    Login.jsx             Mock SSO demo user selector
    Home.jsx              Bento dashboard
    FinderUpload.jsx      4-step upload orchestrator
    OwnerSearch.jsx       Search + filter + pagination + LIR filing
    AdminDashboard.jsx    Metrics + tabbed admin interface
  App.jsx                 Route state, store wiring, match alert listener
  main.jsx                Provider tree: User → Notification → Item → Lir
```

---

## Match Engine (PRD §6.2)

```
Category match         +0.40
Colour overlap ×1      +0.20
Colour overlap ×2      +0.10   (bonus)
Brand match            +0.15
Building match         +0.15
─────────────────────────────
Max score               1.00
Alert threshold         0.60
```

---

## PWA

- `public/manifest.json` — installable with shortcuts for Snap & Upload, Search
- `public/sw.js` — cache-first static, network-first API, push notification handler
- Register: `navigator.serviceWorker.register('/sw.js')`

---

## Connecting Real AI Vision (Production)

Replace `src/services/visionApi.js → analyseImage()`:

```js
export async function analyseImage(file) {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch('/api/analyse-image', { method: 'POST', body: form })
  return res.json()  // Returns PRD §6.1 tag schema
}
```

Server-side Anthropic prompt (PRD §6.1):
> "You are a lost-property assistant. Analyse the image and return JSON with:
> category, colours[], brand|null, condition, description, verificationQuestion,
> verificationAnswer, confidence{category,colours,brand,overall}"

---

## Roadmap (v2)

- [ ] Firebase Firestore real-time backend
- [ ] Campus SSO (Azure AD / Google)
- [ ] Web Push notifications (FCM) — SW is ready
- [ ] Semantic / vector fuzzy matching
- [ ] QR code generation per item
- [ ] Admin analytics charts
- [ ] Email digest for Security Desk
- [ ] Offline queue for Snap & Upload
