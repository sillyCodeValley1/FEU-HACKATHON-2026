# CircuitPal.AI - FEU Hackathon 2026

**⚡ Proudly Integrated with CircuitRocks ⚡**

CircuitPal.AI is an AI-powered electronics project planning assistant built for the FEU Hackathon 2026. It helps makers and hardware enthusiasts design, plan, and manage their electronics projects with ease. Through our **integration with CircuitRocks**, the assistant automatically generates a Bill of Materials (BOM), provides stock availability directly from the CircuitRocks marketplace, maps out a project roadmap, and handles personal inventory tracking.

## Features

- **AI Copilot**: Describe your project idea and get instant AI-powered suggestions, component recommendations, and design guidance using Gemini 2.5 Flash.
- **Auto BOM Generation**: Automatically generates a complete Bill of Materials based on engineering requirements and matches them with available CircuitRocks inventory.
- **Stock Tracking**: View stock availability directly within the project chat and BOM side panel. Select the components you wish to buy with a dynamic price estimator.
- **Project Planning**: Generates step-by-step roadmaps and build plans to guide you through hardware acquisition, assembly, and testing.
- **Inventory Management**: Keep track of the components you already own to avoid duplicate purchases and save money.
- **External Component Sourcing**: If a required component is not available at CircuitRocks, the assistant provides purchase links to external vendors.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Lucide React
- **Backend**: Node.js, Express, TypeScript, Google Generative AI (Gemini)
- **Monorepo Management**: npm workspaces & concurrently

## Prerequisites

Before running the application, ensure you have the following installed:
- Node.js (v18 or higher)
- npm (Node Package Manager)

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sillyCodeValley1/FEU-HACKATHON-2026.git
   cd FEU-HACKATHON-2026
   ```

2. **Install dependencies:**
   This command installs the root dependencies as well as both frontend and backend dependencies.
   ```bash
   npm run install:all
   ```

3. **Configure Environment Variables:**
   Navigate to the `backend` directory and create a `.env` file:
   ```bash
   cd backend
   touch .env
   ```
   Add your Google Gemini API key to the `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Note: If no API key is provided, the application will gracefully fall back to mock responses).*

## Running the Application

You can start both the frontend and backend servers simultaneously from the root directory using:

```bash
npm run dev
```

- The **Frontend** will be available at `http://localhost:5173`
- The **Backend API** will be running at `http://localhost:4000`

## Project Structure

```
├── backend/                # Express backend application
│   ├── src/                # Backend source code (API endpoints, AI integration)
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React frontend application
│   ├── src/                # Frontend source code (Components, Pages, Utilities)
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
└── package.json            # Root configuration and concurrent scripts
```

## Authors & License

Created for the FEU Hackathon 2026.
License: ISC
