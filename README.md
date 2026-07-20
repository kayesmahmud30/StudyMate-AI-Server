# StudyMate AI — Server (Backend)

StudyMate AI Backend is an Express REST API built with TypeScript. It provides APIs for user database management, roadmap creation/editing, progress tracking, statistics aggregation, and connects with Google Gemini AI to generate detailed learning descriptions.

- **Live Application Link**: [https://study-mate-ai-taupe.vercel.app](https://study-mate-ai-taupe.vercel.app)
- **Live API Link**: [https://study-mate-ai-server-gamma.vercel.app](https://study-mate-ai-server-gamma.vercel.app)
- **GitHub Repository**: [https://github.com/kayesmahmud30/StudyMate-AI-Server](https://github.com/kayesmahmud30/StudyMate-AI-Server)

---

## 🛠️ Technology Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express v5 (Beta/New Release)](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/)
- **AI Integration**: [Google Gemini AI API (`@google/generative-ai`)](https://ai.google.dev/)
- **Development Tooling**: [TSX](https://github.com/privatenumber/tsx) (watch runner), TypeScript compiler

---

## ⚙️ Environment Variables (`.env`)

To run the backend server, create a `.env` file in the root of the `StudyMate-Server` directory. Below is the configuration structure containing both development (Localhost) and production settings:

```env
# --- Server Port ---
PORT=8000

# --- Allowed Client Origin URLs (CORS) ---
# Localhost Development (Active by Default)
CLIENT_URL=http://localhost:3000

# Production Deployment (Commented)
# CLIENT_URL=https://your-production-client-url.vercel.app

# --- Database ---
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?appName=Cluster0

# --- Gemini API Key ---
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js (v18+ recommended) and npm installed.

### 1. Clone & Navigate
```bash
git clone <repository-url>
cd StudyMate-Server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root of the project and populate it with the key-value pairs listed in the **Environment Variables** section above.

### 4. Run Development Server
```bash
npm run dev
```
The server will boot and run on [http://localhost:8000](http://localhost:8000).

---

## 📁 Repository Structure

```
StudyMate-Server/
├── src/
│   ├── config/         # MongoDB and external services connection settings
│   ├── controllers/    # Route controllers handling business logic
│   ├── middleware/     # Auth verification and request handler middleware
│   ├── routes/         # Express API routes definition
│   ├── services/       # AI (Gemini) and helper service layers
│   ├── index.ts        # Entry point for Express application
│   └── test_gemini.ts  # Verification helper script for Gemini API key
├── tsconfig.json       # TypeScript compiler settings
└── package.json        # Node dependency manifest
```

---

## 📦 Scripts

- `npm run dev`: Boots server in development mode using `tsx watch` for auto-reloading upon code modifications.
- `npm run build`: Compiles TypeScript files (`src/`) to Javascript in the output directory (`dist/`).
- `npm run start`: Runs the compiled backend using node from `dist/index.js`.
