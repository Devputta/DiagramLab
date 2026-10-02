# DiagramLab

> A professional, browser-based diagram editor for software architecture, flowcharts, UML, database schemas, and technical documentation.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Powered by Vite](https://img.shields.io/badge/Vite-8-646CFF.svg)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933.svg)](https://nodejs.org/)

## Overview

DiagramLab is a lightweight technical diagram workspace designed for developers, students, engineers, and technical teams who need editable diagrams without a heavyweight desktop tool.

It combines an interactive canvas with reusable templates, local project storage, diagram export, dark mode, and an optional server-side Gemini integration for turning natural-language system descriptions into structured editable diagrams.

### Core capabilities

- Technical architecture diagrams
- Flowcharts and process diagrams
- UML-style diagrams
- Database and system diagrams
- Editable nodes and connectors
- Templates for common technical workflows
- Project dashboard and browser-side persistence
- Import/export workflows
- Publication-ready diagram export
- Dark and light themes
- AI-assisted diagram synthesis through a server-side Gemini API
- Local fallback diagram synthesis when AI generation is unavailable
- Express API with security headers, request validation, body-size limits, and rate limiting

## Architecture

```text
Browser
   |
   | HTTPS
   v
Render Web Service
   |
   +----------------------+
   |                      |
   v                      v
Express Server          Vite-built SPA
   |
   +---- /api/health
   |
   +---- /api/ai/generate-diagram
             |
             v
        Google Gemini API
```

The Gemini API key is kept on the server and is never required in the browser bundle.

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19 |
| Language | TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Motion | Motion |
| Server | Node.js + Express |
| AI | Google Gemini via `@google/genai` |
| Persistence | Browser local storage |
| Deployment | Render |

## Local Development

### Requirements

- Node.js 22 or newer
- npm
- Optional: a Google Gemini API key for AI diagram generation

### Install

```bash
npm install
```

### Environment

Create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Do not commit `.env`.

### Start development

```bash
npm run dev
```

The development server starts on the port configured by the application, defaulting to `3000`.

### Production build

```bash
npm run build
npm run start
```

Health check:

```text
/api/health
```

## Deploy to Render

DiagramLab is designed to run as a **Render Web Service**, not a static site, because the Express server handles the Gemini API request without exposing the API key to the browser.

### 1. Push the project to GitHub

Create a repository such as:

```text
DiagramLab
```

Then push the project:

```bash
git init
git add .
git commit -m "Initial DiagramLab release"
git branch -M main
git remote add origin https://github.com/Devputta/DiagramLab.git
git push -u origin main
```

### 2. Create the Render service

In Render:

1. Open **New +**
2. Select **Web Service**
3. Connect your GitHub repository
4. Select the `main` branch
5. Use these settings:

| Setting | Value |
|---|---|
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start` |
| Node Version | `22` or newer |
| Health Check Path | `/api/health` |

### 3. Add the Gemini secret

In Render, open:

**Environment → Environment Variables**

Add:

```text
GEMINI_API_KEY
```

Value:

```text
your_real_gemini_api_key
```

Do not put the real key in GitHub, `README.md`, `.env.example`, screenshots, or frontend source code.

### 4. Deploy

Click **Create Web Service**.

Render will:

1. Clone the repository
2. Install dependencies
3. Build the Vite application
4. Start the Express server
5. Expose the service on an HTTPS URL

### 5. Verify the deployment

Open:

```text
https://YOUR-RENDER-DOMAIN.onrender.com/api/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "DiagramLab",
  "timestamp": "..."
}
```

Then open the main Render URL and test:

- Landing page
- Canvas
- Templates
- Project creation
- Dark/light mode
- Export
- AI Assistant
- AI fallback behavior

## Environment Variables

| Variable | Required | Purpose |
|---|---:|---|
| `GEMINI_API_KEY` | For AI | Server-side Google Gemini authentication |
| `PORT` | No | Render supplies the production port |
| `NODE_ENV` | No | Set to `production` by the deployment environment |

Never expose `GEMINI_API_KEY` through `VITE_*` variables.

## Security

DiagramLab applies several defensive controls:

- Server-side API key handling
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- Disabled `X-Powered-By`
- JSON request-size limit
- AI prompt length validation
- Null-byte sanitization
- AI endpoint rate limiting
- Generated diagram structure validation
- Edge reference validation
- Output field length limits
- Render reverse-proxy awareness

See [SECURITY.md](SECURITY.md) for the security policy and responsible disclosure process.

## Data and Privacy

Diagram projects are primarily stored in the user's browser through local storage.

When AI diagram generation is requested, the entered prompt is sent from the browser to the DiagramLab server and then to the configured Gemini API provider for processing.

Do not enter confidential, proprietary, regulated, or personal information into AI prompts unless you are authorized to process that information through the configured service.

## Project Structure

```text
DiagramLab/
├── src/
│   ├── components/
│   ├── lib/
│   ├── shapes/
│   ├── templates/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── server.ts
├── index.html
├── vite.config.ts
├── package.json
├── .env.example
├── SECURITY.md
├── LICENSE
└── README.md
```

## API

### Health

```http
GET /api/health
```

Returns the service health status.

### Generate Diagram

```http
POST /api/ai/generate-diagram
Content-Type: application/json
```

Example:

```json
{
  "prompt": "Browser connects to an API gateway, which routes requests to an application service and PostgreSQL database.",
  "diagramType": "architecture"
}
```

The endpoint returns structured nodes and edges suitable for the DiagramLab editor.

## Production Notes

- Use HTTPS in production.
- Keep secrets in Render Environment Variables.
- Do not commit `.env`.
- Rotate a Gemini key immediately if it is exposed.
- Keep dependencies updated.
- Review Render logs after deployment.
- Monitor AI usage and provider quotas.
- For high-traffic production deployments, replace the in-memory rate limiter with a distributed solution such as Redis-backed rate limiting.
- Consider adding authentication and persistent server-side project storage before using the application as a multi-user SaaS.

## Troubleshooting

### Build fails

Run locally:

```bash
npm install
npm run build
```

Fix the first error reported by the build before redeploying.

### AI Assistant says Gemini is unavailable

Check the Render environment variables and confirm:

```text
GEMINI_API_KEY
```

is present and valid. Redeploy after changing environment variables if Render does not automatically restart the service.

### Application loads but API requests fail

Open:

```text
/api/health
```

If health works but AI generation fails, inspect the Render service logs and verify the Gemini API key and provider quota.

### Render reports a port problem

Do not hard-code a production port. The server already reads the Render-provided `PORT` variable.

## License

Released under the MIT License. See [LICENSE](LICENSE).

## Author

**DevPutta**

GitHub: https://github.com/Devputta

---

<div align="center">

**DiagramLab — precise diagrams for technical work.**

</div>
