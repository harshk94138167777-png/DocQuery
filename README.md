# DocQ - AI Document Intelligence

DocQ is a full-stack, production-ready web application that allows users to upload documents (PDF, TXT, DOCX, CSV) and chat with them using advanced AI retrieval capabilities. 

Built with scalability in mind, it uses background workers for document processing, Redis for queuing and caching, and modern vector embeddings for intelligent search.

## 🚀 Features

- **Isolated AI Workspaces:** Organize your documents into collections.
- **Role-Based Access Control (RBAC):** Invite members with Viewer, Member, or Admin permissions.
- **Background Document Processing:** Robust document parsing using `bullmq` and Redis.
- **Vector Retrieval:** Employs embeddings and an LLM to answer questions precisely based on your documents.
- **Streaming Responses:** Get real-time answers with source citations using Server-Sent Events (SSE).
- **Modern UI:** Built with React, Vite, and Tailwind CSS using a sleek glassmorphism design.

## 🏗 Architecture & Tech Stack

### Frontend
- **React 18** (Vite)
- **Tailwind CSS** for responsive, utility-first styling
- **React Router** for navigation
- **Lucide React** for icons

### Backend
- **Node.js & Express:** Robust REST API
- **MongoDB & Mongoose:** Persistent data storage
- **Redis:** Used by BullMQ for background job queuing
- **AI Integration:** Langchain, OpenAI / Groq SDK for embeddings and LLM inference
- **Authentication:** JWT with Argon2 password hashing
- **Testing:** Vitest

## 🛠 Local Development Setup

### Prerequisites
- Node.js (v20+)
- Docker & Docker Compose (for MongoDB and Redis)

### 1. Clone & Install
```bash
# Install dependencies across all workspaces
npm install
```

### 2. Infrastructure Setup (Database & Redis)
The easiest way to run the necessary databases locally is via Docker Compose:
```bash
docker-compose up -d
```
This will start MongoDB on port `27017` and Redis on `6379`.

### 3. Environment Variables
Create a `.env` file in the `server` directory (or the root, depending on your setup) based on `.env.example`.
You will need your LLM API keys (e.g., OPENAI_API_KEY).

### 4. Start the Application
You can run both the frontend and backend concurrently using:
```bash
npm run dev
```
- Client runs on `http://localhost:5173`
- Server runs on `http://localhost:3000`

## 🧪 Testing

The backend uses Vitest for unit and integration testing.
```bash
npm run test -w server
```

## 🔒 Security Practices

- **Helmet.js:** Secures Express apps by setting various HTTP headers.
- **Rate Limiting:** Protects the API from brute-force attacks.
- **Argon2:** State-of-the-art password hashing.
- **CORS Configuration:** Strictly bound to the client origin.

## 📝 License

MIT License
