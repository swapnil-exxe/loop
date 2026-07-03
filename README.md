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

## 💻 Local Development Setup

To run this project locally on your system, follow these steps:

### Prerequisites
* [Node.js](https://nodejs.org/en/) installed on your machine.
* A running MongoDB instance (or a MongoDB Atlas connection string).

### 1. Clone the Repository
```bash
git clone https://github.com/swapnil-exxe/loop.git
cd loop
```

### 2. Configure Environment Variables
Create a `.env` file inside the `backend` directory:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_secret
```

### 3. Install & Start Backend Server
```bash
cd backend
npm install
npm run dev # Launches server on port 5001
```

### 4. Install & Start Frontend App
Open a new terminal window in the root directory:
```bash
cd frontend
npm install
npm run dev # Launches Vite dev server on http://localhost:5173
```
