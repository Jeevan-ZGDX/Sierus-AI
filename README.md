# 🏆 AI-Powered Hackathon Tracker & Tech Event Radar

> Autonomous AI Discovery, Deadline Tracking, Multi-Location Directories & Local Storage Persistence.

A production-ready, responsive web application built with **Svelte** and **Vite** that empowers students, developers, and competitive coders to discover hackathons and tech events automatically, manage registration deadlines, track project statuses, and explore events worldwide.

---

## ✨ Features

### 🤖 1. Autonomous AI Scout Agent
- **Live Internet Scraping & Discovery**: Crawls global developer registries, university portals, GitHub hackathon repositories, and tech summit platforms.
- **NLP Metadata Extraction**: Automatically extracts registration deadlines, prize pools, mode (Online/Offline/Hybrid), categories, and event dates.
- **Deduplication Engine**: Merges new events into your dashboard without duplicating existing records.
- **Custom Crawl Prompts & Presets**: Direct the AI Agent to target specific tracks (*Agentic AI, Web3, FinTech*) or specific tech hubs (*San Francisco, London, Bengaluru, Tokyo, Berlin*).
- **Live Terminal & Progress Stream**: Real-time console logs and progress indicators displaying scan activity.

### 🧭 2. Multi-Page Sidebar Views
- 🏆 **Dashboard & All Hackathons**: Comprehensive overview with real-time search, multi-filters, countdown timers, and statistics.
- ✨ **AI New Discoveries Feed**: Dedicated view of opportunities autonomously discovered by the AI Scout Agent with a "Mark All Reviewed" action.
- 📝 **Registered Opportunities**: Focus view for events you are currently registered or participating in.
- ⏳ **Not Registered Yet**: Open opportunities with active deadlines waiting for your application.
- 📍 **Hackathons by Location**: Filter competitions by city and region (*San Francisco, Bengaluru, London, Tokyo, Berlin, Austin, New York, Singapore, Online*).
- 🎪 **Tech Events & Summits by Location**: Discover developer summits, engineering meetups, and keynote conferences worldwide.
- 🤖 **AI Scout Console**: Control center for configuring automated crawling intervals, executing targeted scans, and inspecting terminal logs.

### 🛠️ 3. Core Management & UX
- 🔍 **Real-Time Instant Search**: Dynamic filtering across title, organizer, category, location, and description.
- 🏷️ **Multi-Dimensional Filters**: Chain filters by **Category** (9+ tracks), **Mode** (*Online, Offline, Hybrid*), and **Registration Status**.
- ⭐ **Bookmarking**: Star favorite events and filter by bookmarked status.
- ⏳ **Smart Deadline Countdowns**: Visual badges (`⏳ 14 days remaining`, `⏳ Closes Today!`, `🔴 Registration Closed`).
- 💾 **Local Storage & Data Portability**: Client-side storage with 1-click **JSON Backup Export** and **JSON Restore Import**.
- 🌓 **Adaptive Dark / Light Mode**: System theme detection and manual toggle with smooth CSS transitions.

---

## 🛠️ Tech Stack

- **Frontend**: [Svelte 5](https://svelte.dev/)
- **Bundler**: [Vite 5](https://vite.dev/)
- **State Management**: Reactive Svelte Writable & Derived Stores
- **Styling**: Modern CSS with CSS Custom Properties, Flexbox & CSS Grid
- **Icons**: Accessible custom SVG icon suite
- **Storage**: Browser `localStorage` API
- **Deployment**: Vercel, Netlify, GitHub Pages, Docker / Nginx

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 🌐 Production Deployment

- **Vercel**: Pre-configured with [vercel.json](file:///run/media/vampire/68F2C653F2C62562/volume/svelte-project/vercel.json)
- **Netlify**: Pre-configured with [netlify.toml](file:///run/media/vampire/68F2C653F2C62562/volume/svelte-project/netlify.toml)
- **GitHub Pages**: Automated workflow in [.github/workflows/deploy.yml](file:///run/media/vampire/68F2C653F2C62562/volume/svelte-project/.github/workflows/deploy.yml)
- **Docker**: Containerized with [Dockerfile](file:///run/media/vampire/68F2C653F2C62562/volume/svelte-project/Dockerfile) and [nginx.conf](file:///run/media/vampire/68F2C653F2C62562/volume/svelte-project/nginx.conf)
