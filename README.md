# DiagramLab

> **A browser-based workspace for creating, editing, and documenting technical diagrams.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react\&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript\&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite\&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js\&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express\&logoColor=white)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## Overview

**DiagramLab** is a technical diagram workspace built for creating clear, editable, and structured visual documentation directly in the browser.

The application brings diagram editing, reusable templates, project organization, export workflows, local persistence, and AI-assisted diagram generation into a single workspace.

It is designed for software architecture, system design, engineering documentation, process visualization, database modeling, UML-style diagrams, and technical communication.

---

## Product Flow

```mermaid
flowchart LR
    A[User] --> B[DiagramLab Workspace]

    B --> C[Create Diagram]
    B --> D[Use Template]
    B --> E[Open Project]
    B --> F[AI Assistant]

    C --> G[Interactive Canvas]
    D --> G
    E --> G

    F --> H[Diagram Generation API]
    H --> I[Gemini]
    I --> H
    H --> G

    G --> J[Edit & Organize]
    J --> K[Export / Save]
```

---

## Core Capabilities

### Diagram Workspace

* Interactive diagram canvas
* Editable nodes and connectors
* Node positioning and manipulation
* Structured diagram relationships
* Multiple diagram styles
* Technical documentation-oriented layout

### Diagram Types

* Software architecture
* System architecture
* Flowcharts
* Process diagrams
* UML-style diagrams
* Database schemas
* Service and infrastructure diagrams
* Technical workflows

### Templates

Reusable starting points for common technical scenarios.

Templates provide predefined diagram structures that can be edited and extended within the workspace.

### Project Workspace

DiagramLab provides browser-based project organization for working with multiple diagrams.

Projects can be created, opened, edited, duplicated, and managed from the application workspace.

### Export

Diagrams can be transformed into presentation and documentation-ready outputs through the application's export workflows.

### Themes

The interface supports:

* Light mode
* Dark mode

The visual system is designed for both focused editing and technical presentation.

---

# AI-Assisted Diagram Generation

DiagramLab includes an optional AI workflow for converting natural-language system descriptions into structured diagrams.

Instead of manually creating every component, users can describe a system in natural language and receive a structured diagram that can then be edited inside the canvas.

## AI Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as DiagramLab UI
    participant API as Express API
    participant AI as Gemini
    participant C as Canvas

    U->>UI: Describe system
    UI->>API: Submit diagram request
    API->>AI: Generate structured diagram
    AI-->>API: Nodes and relationships
    API-->>UI: Validated diagram
    UI->>C: Render editable diagram
    U->>C: Modify diagram
```

The AI workflow is designed around **structured diagram data rather than generated images**, allowing generated results to remain editable.

---

# Application Architecture

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI["React Application"]
        Canvas["Diagram Canvas"]
        Projects["Project Workspace"]
        Templates["Template System"]
        Storage["Browser Storage"]
    end

    subgraph Server["Application Server"]
        Express["Express Server"]
        Health["Health API"]
        AIEndpoint["AI Diagram API"]
        Validation["Request & Output Validation"]
        Security["Security Controls"]
    end

    subgraph External["External Service"]
        Gemini["Google Gemini API"]
    end

    UI --> Canvas
    UI --> Projects
    UI --> Templates
    Projects --> Storage

    UI --> Express

    Express --> Health
    Express --> AIEndpoint
    AIEndpoint --> Validation
    Validation --> Security
    Security --> Gemini

    Gemini --> Security
    Security --> Validation
    Validation --> AIEndpoint
    AIEndpoint --> UI
```

---

# Diagram Generation Flow

```mermaid
flowchart LR
    A["Natural Language Input"]
    B["Request Validation"]
    C["AI Processing"]
    D["Structured Diagram"]
    E["Schema Validation"]
    F["Canvas Rendering"]
    G["Editable Diagram"]

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
```

The generated result is processed as structured diagram data before being rendered by the editor.

This allows users to continue modifying the generated architecture instead of receiving a static image.

---

# Editing Flow

```mermaid
flowchart TD
    A["Open Workspace"] --> B["Select or Create Diagram"]

    B --> C["Add Nodes"]
    B --> D["Edit Nodes"]
    B --> E["Create Connections"]

    C --> F["Canvas State"]
    D --> F
    E --> F

    F --> G["Organize Diagram"]
    G --> H["Save Project State"]
    H --> I["Export Diagram"]
```

---

# Project Data Flow

```mermaid
flowchart LR
    A["User Action"] --> B["React State"]
    B --> C["Diagram Model"]
    C --> D["Project State"]
    D --> E["Browser Storage"]

    E --> D
    D --> C
    C --> B
```

Project data is primarily maintained in the browser, allowing the workspace to preserve diagram state without requiring a dedicated application database.

---

# Security Architecture

DiagramLab separates browser functionality from server-side AI communication.

```mermaid
flowchart TB
    Browser["Browser Application"]
    API["Express API"]
    Validation["Input Validation"]
    Limits["Request Limits"]
    Rate["Rate Limiting"]
    Gemini["Gemini API"]
    Response["Validated Response"]

    Browser --> API
    API --> Validation
    Validation --> Limits
    Limits --> Rate
    Rate --> Gemini
    Gemini --> Response
    Response --> Browser
```

The AI provider credential remains on the server side rather than being embedded into the browser application.

Security controls include:

* Server-side API credential handling
* Request validation
* Request body-size limits
* Prompt length restrictions
* Input sanitization
* AI endpoint rate limiting
* Generated diagram validation
* Diagram relationship validation
* Output field limits
* Security response headers
* Reduced server information exposure

---

# Fallback Generation

DiagramLab also supports a local fallback workflow when external AI generation is unavailable.

```mermaid
flowchart TD
    A["Diagram Request"] --> B{"AI Service Available?"}

    B -->|Yes| C["Gemini Generation"]
    B -->|No| D["Local Diagram Synthesis"]

    C --> E["Structured Diagram"]
    D --> E

    E --> F["Validation"]
    F --> G["Editable Canvas"]
```

This keeps the diagram creation workflow usable even when the external AI service cannot complete a request.

---

# Technology Stack

| Layer              | Technology            |
| ------------------ | --------------------- |
| Frontend           | React 19              |
| Language           | TypeScript            |
| Build Tool         | Vite                  |
| Styling            | Tailwind CSS          |
| Icons              | Lucide React          |
| Animation          | Motion                |
| Backend            | Node.js               |
| API Layer          | Express               |
| AI Integration     | Google Gemini         |
| Client Persistence | Browser Local Storage |
| Deployment Model   | Web Service           |

---

# Frontend Architecture

```mermaid
flowchart TB
    App["Application"]

    App --> Workspace["Workspace"]
    App --> Dashboard["Project Dashboard"]
    App --> Templates["Templates"]
    App --> Assistant["AI Assistant"]

    Workspace --> Canvas["Diagram Canvas"]
    Workspace --> Toolbar["Editor Controls"]
    Workspace --> Inspector["Properties / Controls"]

    Dashboard --> Projects["Projects"]
    Templates --> TemplateData["Template Definitions"]

    Canvas --> Nodes["Diagram Nodes"]
    Canvas --> Edges["Diagram Connections"]

    Assistant --> API["AI API"]
```

---

# Backend Architecture

```mermaid
flowchart TB
    Client["React Client"]

    Client --> Express["Express Application"]

    Express --> Health["Health Endpoint"]
    Express --> AI["AI Generation Endpoint"]

    AI --> Validation["Input Validation"]
    Validation --> RateLimit["Rate Limiting"]
    RateLimit --> Gemini["Gemini Provider"]

    Gemini --> Output["Structured AI Output"]
    Output --> Schema["Output Validation"]
    Schema --> Client
```

---

# Project Structure

```text
DiagramLab/
│
├── src/
│   ├── components/
│   ├── lib/
│   ├── shapes/
│   ├── templates/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
│
├── server.ts
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── .env.example
├── .gitignore
├── render.yaml
├── SECURITY.md
├── LICENSE
└── README.md
```

---

# Application Layers

```text
┌─────────────────────────────────────────────┐
│                  DiagramLab                 │
├─────────────────────────────────────────────┤
│              Presentation Layer             │
│        React • UI • Themes • Controls       │
├─────────────────────────────────────────────┤
│               Workspace Layer               │
│      Canvas • Nodes • Edges • Projects      │
├─────────────────────────────────────────────┤
│                Data Layer                   │
│        Diagram Model • Local Storage        │
├─────────────────────────────────────────────┤
│                 API Layer                   │
│       Express • Validation • Rate Limit     │
├─────────────────────────────────────────────┤
│               AI Integration                │
│                 Gemini API                  │
└─────────────────────────────────────────────┘
```

---

# Design Principles

DiagramLab is built around several core principles:

### Editable First

Generated and manually created diagrams remain structured and editable rather than being treated as static images.

### Structured Data

Diagram elements are represented as structured nodes and relationships, enabling manipulation, validation, and export.

### Browser-Centered

The primary editing experience runs directly in the browser.

### Secure AI Integration

External AI credentials are handled server-side rather than exposed through the client application.

### Practical Technical Documentation

The interface is designed around real-world engineering diagrams rather than purely visual drawing.

### Minimal Infrastructure

Browser persistence reduces the infrastructure required for basic project usage.

---

# Use Cases

DiagramLab can be used for:

* Software architecture planning
* System design documentation
* Database modeling
* API architecture visualization
* Infrastructure diagrams
* Application workflows
* Process documentation
* UML-style modeling
* Engineering presentations
* Technical project documentation
* AI-assisted architecture exploration

---

# Key Workflow

```mermaid
flowchart LR
    A["Describe"] --> B["Generate"]
    B --> C["Edit"]
    C --> D["Organize"]
    D --> E["Validate"]
    E --> F["Export"]
```

**Describe → Generate → Edit → Organize → Validate → Export**

---

# Security Model

DiagramLab treats the browser and external AI provider as separate trust boundaries.

```mermaid
flowchart TB
    U["User"]

    subgraph Browser["Client Trust Boundary"]
        UI["DiagramLab UI"]
        State["Diagram State"]
    end

    subgraph Server["Server Trust Boundary"]
        API["Express API"]
        Guard["Validation & Controls"]
        Secret["Server-side API Credential"]
    end

    subgraph Provider["External Boundary"]
        AI["Gemini API"]
    end

    U --> UI
    UI --> State
    UI --> API
    API --> Guard
    Guard --> Secret
    Guard --> AI
    AI --> Guard
    Guard --> API
    API --> UI
```

This separation prevents the AI provider credential from becoming part of the client-side application bundle.

---

# Summary

DiagramLab brings together:

* Interactive technical diagram editing
* Architecture and workflow visualization
* Reusable diagram templates
* Browser-based project management
* Local project persistence
* Export workflows
* Dark and light themes
* AI-assisted structured diagram generation
* Local fallback generation
* Server-side AI integration
* Request and output validation
* Application-level security controls

The result is a focused technical workspace for creating **editable, structured, and documentation-ready diagrams directly in the browser**.

---

<div align="center">

**DiagramLab**

*Create. Structure. Visualize.*

</div>
