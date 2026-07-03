# 🚀 LOOP — Launchpad Of Outstanding Placements

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react&style=flat-square)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node.js-Express-green?logo=node.js&style=flat-square)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb&style=flat-square)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel&style=flat-square)](https://vercel.com/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&style=flat-square)](https://render.com/)

**LOOP** is a premium, community-driven placement preparation portal designed for college students to bridge the gap between academic learning and real-world placement success. It acts as a localized knowledge-sharing ecosystem where juniors learn directly from the verified journeys, preparation roadmaps, and resumes of successful seniors and alumni.

---

## ✨ Live Demo & Credentials

Experience the live application deployed across standard cloud providers:

* 🌐 **Live Website (Frontend)**: [https://loop-seven-delta.vercel.app/](https://loop-seven-delta.vercel.app/)
* ⚙️ **API Server (Backend)**: [https://loop-qnh9.onrender.com/](https://loop-qnh9.onrender.com/)
* 📦 **Cloud Database**: MongoDB Atlas Sandbox

### 🔑 Test Access Credentials
You can log in to the portal using this pre-registered account to explore features:
* **Email Address**: `student@spit.ac.in`
* **Password**: `student123`



---

## 🌟 Real-World Problems Solved

Many college students struggle during the placement season not because of a lack of talent, but due to a lack of guidance and clarity. LOOP solves several critical real-world problems:

### 1. The "Where to Start?" Dilemma (Lack of Roadmaps)
* **Problem**: Most college students want to prepare for top-tier companies but have no structured roadmap. They don't know what to focus on in their 1st, 2nd, 3rd, or 4th years.
* **Solution**: LOOP features a detailed, year-by-year timeline (`firstYear`, `secondYear`, `thirdYear`, `fourthYear` journeys) for every senior story. Juniors can see exactly when seniors started DSA, when they built projects, and when they applied for internships.

### 2. Resume Building Ambiguity
* **Problem**: College students struggle to build competitive resumes. They don't know what templates to use or what projects are valued.
* **Solution**: LOOP allows seniors to upload their actual resumes. Juniors can view successful resumes that secured shortlists at companies like Microsoft, NVIDIA, Cisco, and Zoho.

### 3. Gap Between Theory and Practical Interviews
* **Problem**: Online preparation resources are generic, while actual campus recruitment processes are highly specific.
* **Solution**: Every profile contains a **"How I Secured My Placement"** section that breaks down the exact rounds:
  * Online Assessment (OA) topics and difficulty.
  * Technical Interview coding questions (e.g., trees, graphs, system design).
  * HR round details and behavioral expectations.

### 4. Fragmented & Unverified Study Resources
* **Problem**: Students waste hours sorting through low-quality or outdated tutorials and sheets.
* **Solution**: LOOP features a curated **Study Resources** portal structured into hierarchical folders where high-achieving seniors upload verified roadmaps, cheat sheets, and books, which are then vetted by administrators.

---

## ⚡ Performance Optimizations (High-Performance Engine)

To deliver a premium, fluid user experience, several state-of-the-art web optimizations have been engineered into the platform:

* **Stale-While-Revalidate (SWR) Cache Layer**: Implemented custom cached hooks that fetch data from an in-memory registry and synchronize it to `sessionStorage`. Page transitions load in **0ms** from cache while re-fetching from the server in the background to ensure data is never stale.
* **Optimistic UI State Updates**: User actions (approving/rejecting stories, deleting resources, and adding folders) reflect in the UI **instantly** before the API request completes, rolling back automatically only if an error is encountered.
* **Parallelized Fetches**: Backend fetching in the Admin Dashboard is parallelized using `Promise.all`, resolving all queues and metrics simultaneously to speed up dashboard loads by **~7x**.
* **Hardware-Accelerated Skeleton Loaders**: Implemented custom shimmering keyframe skeleton grids (`.skeleton-pulse` and CSS shimmers) to ensure visually smooth loading states during initial cold loads.
* **Large File Upload Optimization**: Express payloads are scaled up to `200mb` on the backend, paired with an extended client-side upload timeout of **10 minutes** to support large PDF resource uploads.

---

## 🛠️ Technology Stack & Languages

| Component | Technology | Use Case |
| :--- | :--- | :--- |
| **Frontend** | **React 19** (Vite 8) | Single Page Application UI with React Router v7. |
| **Styling** | **Vanilla CSS Variables** | Glassmorphic, premium dark theme design with micro-animations. |
| **Caching** | **SWR Hooks** | Instant cache loading, stale-while-revalidate background sync. |
| **Backend** | **Node.js + Express** | RESTful API server with custom security filters. |
| **Database** | **MongoDB Atlas** | Managed cloud NoSQL database. |
| **ODM** | **Mongoose** | Schema modeling and index-optimized validation. |

---

## 📂 Core Database Schema Models

The database is structured into models that manage user access, student journeys, study folders, and files:

1. **User Model**: Handles role-based authentication (`Administrator`, `Senior / Contributor`, `Alumni / Contributor`, and `Student`).
2. **Story Model**: Stores placement details (CGPA, Branch, Company, Role, Year Placed) and the 4-year roadmap/interview breakdown.
3. **PendingStory Model**: Holds newly submitted or edited stories in a moderation queue for administrator approval.
4. **Resource & PendingResource Models**: Manages study links, PDF roadmaps, and cheat sheets.
5. **Folder Model**: Manages the folder directory structure so resources can be nested in folders like `/DSA`, `/System Design`, or `/Web Dev`.
6. **Achievement Model**: Highlights key college achievements, hackathon victories, and outstanding selections.

---

## 📅 2-Month Development Journey & Challenges Overcome

Building **LOOP** from an idea to a fully optimized, production-ready portal was a 2-month journey of active engineering. Here is the week-by-week timeline of how the application was built and the technical challenges solved along the way:

### 🛠️ Phase 1: Foundation & Layout Design (Weeks 1-2)
* **Goal**: Establish the theme, layout, routing structure, and database models.
* **Key Achievements**:
  * Set up a responsive CSS framework with customized variables for a premium dark mode, glassmorphic card panels, and navigation bars.
  * Configured React Router v7 for routing and navigation structures.
* **Challenge Overcome**: 
  * *CSS layout collapses*: On mobile viewports, dashboard grids collapsed. Solved by implementing dynamic viewport calculations (`dvh`) and flexible CSS grid layouts.

### 🔑 Phase 2: User Access & Role-Based Security (Weeks 3-4)
* **Goal**: Secure the site and build registration, onboarding, and role-based login interfaces.
* **Key Achievements**:
  * Developed registration and onboarding portals where new students fill in their current branch, year, CGPA, and placement status.
  * Programmed secure JWT-based backend controllers and passport-style token interceptors.
* **Challenge Overcome**:
  * *Password visibility issues*: Users often typed incorrect passwords during login with no way to verify. Solved by implementing a custom eye icon component with responsive toggle states.

### 📂 Phase 3: Data Management & File Upload Architecture (Weeks 5-6)
* **Goal**: Create the stories database model, administrative moderation dashboard, and study folder resources portal.
* **Key Achievements**:
  * Developed the hierarchical folder management engine, enabling nesting of links and PDF files like `/DSA/Trees/Roadmap.pdf`.
  * Created the Admin Panel moderation queues for vetting senior stories and study resource files.
* **Challenge Overcome**:
  * *Admin Form Data Missing on Edit*: Clicking "Edit" on active stories loaded empty rich-text fields (journey roadmaps and attached files) because the backend list endpoint excluded those heavy fields. Solved by redesigning the React action pipeline to trigger background API fetches via `getStoryById(item.id)` to load complete data.

### ⚡ Phase 4: Scaling, Performance & Security Hardening (Weeks 7-8)
* **Goal**: Optimize page speed, resolve cloud bugs, and prepare the site for public production deployment.
* **Key Achievements**:
  * Programmed custom cache registries (`sessionStorage` SWR layers) and parallelized Express API calls using `Promise.all` to accelerate dashboard speeds.
  * Configured build-time lint checks to clear all warnings and prevent build crashes.
* **Challenges Overcome**:
  * *PDF Preview Connection Refused (CORS & Helmet)*: Direct embedding of PDF resumes inside `<iframe>` tags failed due to strict `frame-ancestors` policy. Solved by adjusting `helmet` frameguard settings on the Express server to white-list Vercel app domains.
  * *Vercel SPA Route Refresh 404s*: Refreshing pages like `/admin` or `/resources` directly triggered Vercel 404 errors. Solved by adding a custom `vercel.json` rewrite configuration rule to redirect all traffic to `index.html`.
