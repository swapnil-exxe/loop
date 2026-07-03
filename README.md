# LOOP - Placements & Stories Platform

### 🏷️ What does LOOP stand for?
* **L**aunchpad
* **O**f
* **O**utstanding
* **P**lacements

---

LOOP is a premium, community-driven placement preparation portal designed for college students to bridge the gap between academic learning and real-world placement success. It acts as a localized knowledge-sharing ecosystem where juniors learn directly from the verified journeys, preparation roadmaps, and resumes of successful seniors and alumni.

---

## 🌟 Real-World Problems Solved

Many college students struggle during the placement season not because of a lack of talent, but due to a lack of guidance and clarity. LOOP solves several critical real-world problems:

### 1. The "Where to Start?" Dilemma (Lack of Roadmaps)
* **Problem**: Most college students want to prepare for top-tier companies but have no structured roadmap. They don't know what to focus on in their 1st, 2nd, 3rd, or 4th years, which often leads to analysis paralysis or not starting at all.
* **Solution**: LOOP features a detailed, year-by-year timeline (`firstYear`, `secondYear`, `thirdYear`, `fourthYear` journeys) for every senior story. Juniors can see exactly when seniors started DSA, when they built projects, and when they applied for internships, giving them a clear, proven timeline to follow.

### 2. Resume Building Ambiguity
* **Problem**: College students struggle to build competitive resumes. They don't know what templates to use, what projects are valued, or how to describe their work.
* **Solution**: LOOP allows seniors to upload their actual resumes (both direct download files and text breakdowns). Juniors can view successful resumes that secured shortlists at companies like Microsoft, NVIDIA, Cisco, and Zoho, showing them a clear template and structure to mirror.

### 3. Gap Between Theory and Practical Interviews
* **Problem**: Online preparation resources are generic, while actual campus recruitment processes are highly specific (e.g., number of rounds, type of OA questions, specific core topics like DBMS/OS/CN).
* **Solution**: Every profile contains a **"How I Secured My Placement"** section that breaks down the exact rounds:
  * Online Assessment (OA) topics and difficulty.
  * Technical Interview coding questions (e.g., trees, graphs, system design).
  * HR round details and behavioral expectations.

### 4. Fragmented & Unverified Study Resources
* **Problem**: Students waste hours sorting through low-quality or outdated tutorials and sheets.
* **Solution**: LOOP features a curated **Study Resources** section structured into hierarchical folders. High-achieving seniors upload verified roadmaps, cheat sheets, and books, which are then vetted by administrators.

---

## 🛠️ Technology Stack & Languages

LOOP is built using a modern, fast, and scalable full-stack JavaScript architecture:

### Frontend (User Interface)
* **Language**: JavaScript (ES6+), HTML5, CSS3.
* **Framework**: **React 19** (for component-based, dynamic UI rendering).
* **Router**: **React Router DOM v7** (for single-page navigation).
* **Styling**: **Vanilla CSS & Inline Styles** tailored with CSS custom properties (variables) for a premium, high-contrast dark theme.
* **Icons**: **Lucide React** (modern, clean iconography).
* **Build Tool**: **Vite 8** (high-performance development and bundling).

### Backend (API Server)
* **Runtime**: **Node.js**.
* **Framework**: **Express.js** (lightweight RESTful API server).
* **Security & Configuration**: `dotenv` (environment configuration) and `cors` (Cross-Origin Resource Sharing).

### Database & ODM
* **Database**: **MongoDB Atlas** (cloud-hosted NoSQL database).
* **ODM**: **Mongoose** (for schema validation and data modeling).

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

## 🚀 Key Website Features

* **Landing Page**: Full-bleed hero banner introducing the platform with dynamic navigation.
* **Stories Page**: Search and filter placement histories by student name, company, job role, branch, and resources.
* **Story Details**: Deep-dive profile detailing year-by-year journeys, project files, preparation roadmaps, and direct download links for their resumes.
* **Resources Portal**: Hierarchical folder system allowing students to browse and search study resources.
* **Admin Dashboard**: Comprehensive control panel for Admins to manage users, approve or reject stories and resources, and keep content clean.
