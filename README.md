# Clausely AI — Autonomous Legal Operating System & Document Workspace

Clausely AI is an advanced, autonomous legal operating system that transforms how legal professionals draft, review, and organize documents. By combining client-side multi-agent routing with high-fidelity document editing and interactive, model-driven matter setups, Clausely delivers a seamless, production-ready legal workspace.

---

## 🌟 Key Features

### 1. Model-Reasoned Case Context Setup
Instead of hardcoding workspace variables, Clausely transfers decision-making to the model. When a user requests a draft (e.g., *"draft an NDA"*), the Gemini model reasons over the prompt:
*   Determines if case context or party details (Plaintiff/Party A and Defendant/Party B) are missing.
*   Outputs a structured JSON action to request case setup.
*   Triggers an interactive **Inline Setup Widget** directly within the chat feed.
*   Accepts custom Matter Names, Links to Existing Projects, and retrieves party information before initiating the drafting pipeline.

### 2. High-Fidelity ONLYOFFICE / MS Word Style Ribbon Editor
A browser-native stacked canvas that provides a premium document viewing and editing experience:
*   **Ribbon Toolbar:** Tabs for **Home** (Typography, Sizes, Bold/Italic/Underline, paragraph alignment controls, print), **Layout** (Double/Single Line spacing, Margin presets), and **Insert** (Page additions).
*   **Horizontal Ruler:** Visual alignment indicators matching margins.
*   **Stacked A4 Sheets:** Rendered pages with custom styling, custom editable header/footer zones, and page number tracking (`Page X of Y`).
*   **Real-time Autosave:** Direct `contentEditable` bindings save all user edits back to the active React state instantly, preserving human-in-the-loop updates for subsequent agent runs.

### 3. Client-Side Gemini 3.5 Flash Integration
*   Routes all primary drafting and chat tasks client-side to **Gemini 3.5 Flash** using browser `fetch` APIs.
*   Preserves user privacy using local agent-execution paths with a clean local deterministic harness fallback.

### 4. Interactive Voice & TTS Dictation
*   **Mic Dictation:** Leverages the Web Speech API to capture speech and convert it to chat inputs.
*   **Live Talk:** Submits spoken queries, streams responses, reads outputs aloud via `speechSynthesis`, and automatically directs the user to the editor canvas with the new draft populated.

---

## 🛠️ Tech Stack
*   **Core:** React, Next.js (App Router), TypeScript, Tailwind CSS
*   **AI Engine:** Google Gemini 3.5 Flash (Client-Side), Clausely Multi-Agent Harness (`src/agent/`)
*   **APIs & Voice:** Web Speech API, SpeechSynthesis, Resend SMTP
*   **Deployment:** Docker, Vercel

---

## 🐳 Getting Started (Containerized Setup)

Clausely is fully containerized for standard deployment.

### Prerequisites
*   [Docker](https://www.docker.com/)
*   [Docker Compose](https://docs.docker.com/compose/)

### Running with Docker Compose
To build and run the application in a production-ready container:

```bash
# Clone the repository
git clone https://github.com/insert-username-sample/clausely-web.git
cd clausely-web

# Build and start the container
docker-compose up --build
```

The application will build Next.js in production mode and serve it on [http://localhost:3000](http://localhost:3000).

---

## 💻 Local Development Setup

To run the Next.js development server locally:

```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📄 Submission Information

*   **Project Title:** Clausely AI: Autonomous Legal Operating System
*   **Repository URL:** [https://github.com/insert-username-sample/clausely-web](https://github.com/insert-username-sample/clausely-web)
*   **Branch:** `feat/dashboard-gemini-voice`
