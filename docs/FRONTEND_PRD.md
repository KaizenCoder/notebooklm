# Product Requirements Document (PRD) - Frontend for InsightsLM Local

Scope & Parity Note
- This document enforces strict parity with the original InsightsLM Local frontend. No new features or UX changes.
- The only backend change is replacing n8n with a local API exposing the same webhooks used by existing Supabase Edge Functions.
- Database requirement: all data persists to a local PostgreSQL instance (with pgvector). If Supabase is used, it must run locally and back onto this local PostgreSQL. No cloud DB.
 - Governance: Implementer/Auditor pairing; SPEC→IMPL→TEST→AUDIT workflow via Task Master; weekly parity reviews against the original UI/flows.

Source of Truth
- Always cross‑reference the cloned model repos under `docs/clone/` when implementing or reviewing changes:
  - `docs/clone/insights-lm-public-main/insights-lm-public-main`
  - `docs/clone/insights-lm-local-package-main/insights-lm-local-package-main`
- Do not introduce deviations; any necessary “validated adaptation” must be documented with a link to the original file and rationale.
- Infrastructure constraint: local PostgreSQL only (pgvector). Supabase usage, if any, is local-only.
 - Governance constraint: no implementation work without a Task Master task ID; FE tasks must include parity validation steps and mock contracts when BE is not ready.

## 1. Introduction

This Product Requirements Document (PRD) outlines the scope, features, and development plan for the frontend of the InsightsLM Local project. The frontend serves as the primary user interface, enabling interaction with documents, AI-powered chat, and audio generation capabilities. It is designed to seamlessly integrate with the local API Orchestrator (backend), which replaces the n8n workflow from the original project.

The frontend's role is crucial in delivering a cohesive user experience, ensuring that all functionalities provided by the backend are accessible and intuitive for the end-user.

## 2. Frontend Vision & Goals

The frontend strictly mirrors the original product’s user experience and flows. No additional capabilities are added; interactions, data contracts, and realtime behavior remain identical. The only backend change is the webhook destination (local orchestrator instead of n8n), which is transparent to the UI.

Key Goals
- Maintain existing UX/UI exactly as in the original.
- Integrate via current Supabase Edge Functions; only their webhook targets change.
- Preserve full functionality present in the original, including chat with citations, document ingestion/indexing, and local audio/transcription if exposed by the original.

## 3. Scope

### In-Scope

*   **Adaptation for API Orchestrator Consumption:** Modifying existing frontend components and logic to correctly consume data and trigger actions via the Supabase Edge Functions, which in turn communicate with the API Orchestrator.
*   **Data Model & Communication Protocol Alignment:** Ensuring that the frontend's data models and communication protocols precisely match the expectations and responses of the API Orchestrator.
*   **Backend State Handling:** Implementing robust mechanisms to handle various success and error states returned by the API Orchestrator and Supabase Edge Functions, providing clear feedback to the user.
*   **UI/UX Preservation:** Maintaining the current user interface and user experience, with no planned major redesigns unless necessitated by new features or critical usability issues.

### Out-of-Scope

*   **Major UI/UX Redesigns:** Comprehensive overhauls of the user interface or experience are not part of this PRD, unless directly driven by the integration of new core functionalities.
*   **New Core Functionalities:** Development of entirely new features that are not supported by the API Orchestrator or the overall project vision.
*   **Underlying Framework Changes:** Significant modifications to the core React/Vite/TypeScript framework, unless absolutely essential for compatibility or critical performance improvements.

## 4. Key Features (Frontend Perspective)

The frontend will provide the user interface and interaction logic for the following key features:

*   **User Authentication & Management:**
    *   Login, logout, and user session management (handled directly via Supabase).
*   **Notebook & Source Management:**
    *   Creation, viewing, and organization of notebooks and associated sources (handled directly via Supabase).
*   **Document Ingestion:**
    *   User interface for uploading or providing PDF, plain text, and web content.
    *   Real-time display of document processing status (e.g., "processing," "completed," "failed").
    *   Presentation of indexed content within the application.
*   **Chat Interaction (RAG - Retrieval Augmented Generation):**
    *   Interface for sending text messages to the AI.
    *   Display of AI-generated responses, including verifiable citations linked to source documents.
    *   Management and display of chat history for ongoing conversations.
*   **Additional Sources Ingestion:**
    *   User interface elements for inputting copied text directly into the system.
    *   User interface elements for providing multiple website URLs for ingestion.
    *   Display of processing status specific to these new source types.
*   **Audio Generation:**
    *   User interface to trigger the generation of audio summaries or podcasts from notebook content.
    *   Integrated audio player for playback of generated audio files.
    *   Display of audio generation status (e.g., "generating," "available").

## 5. Technical Considerations & Analysis

### Technology Stack

The frontend is built upon a robust and modern web development stack:

*   **Core:** React (for UI components), Vite (as a fast build tool), TypeScript (for type-safety and improved code quality).
*   **UI Components:** Shadcn/UI, leveraging Radix UI primitives for accessible and customizable UI components.
*   **Styling:** Tailwind CSS for utility-first CSS styling.
*   **Data Management:** `@supabase/supabase-js` for direct interaction with Supabase, and `@tanstack/react-query` for efficient data fetching, caching, and synchronization.
*   **Routing:** `react-router-dom` for client-side routing.

### Backend Interaction Model

The frontend's interaction with the backend is designed with a clear separation of concerns:

*   **Direct Supabase Interaction (local-only):** The frontend directly communicates with Supabase (running locally) for core functionalities such as user authentication, Row Level Security (RLS), and real-time data updates related to notebooks, sources, and user notes. This leverages the `@supabase/supabase-js` client library bound to a local PostgreSQL database.
*   **Mocks for Parallelism:** Until orchestrator webhooks are available, FE uses mocked responses consistent with documented API contracts to maintain progress without breaking parity.
*   **Indirect Interaction via Supabase Edge Functions:** For more complex, AI-related operations (e.g., document processing, chat, audio generation), the frontend does *not* directly call the API Orchestrator. Instead, it invokes specific Supabase Edge Functions (e.g., `supabase.functions.invoke('process-document')`, `supabase.functions.invoke('process-additional-sources')`, `supabase.functions.invoke('send-chat-message')`). These Edge Functions then call the orchestrator webhooks (`/webhook/process-document`, `/webhook/process-additional-sources`, `/webhook/chat`). This ensures secrets (like `NOTEBOOK_GENERATION_AUTH`) remain server-side only.

Security requirements:
- The frontend must never embed or transmit `NOTEBOOK_GENERATION_AUTH` or any service role keys. Edge Functions are responsible for setting the appropriate Authorization header when calling the backend.
- The API Orchestrator must remain on an internal Docker network; frontend calls go exclusively through Supabase/Edge.
- Database remains strictly local PostgreSQL; no cloud endpoints are permitted.
 - Governance: all feature cycles follow SPEC→IMPL→TEST→AUDIT; parity validation steps are mandatory before marking tasks done.

### API Contracts
Strict adherence to the API contracts defined by the original Edge Functions is paramount. The frontend must send requests and expect responses precisely as specified in `DOCUMENTATION_PROJET.md` and `WEBHOOKS_MAPPING.md`. Any deviation will lead to integration failures. Maintain close alignment with backend schema for:
- `process-document` (file or extracted text),
- `process-additional-sources` (types: `copied-text`, `multiple-websites`),
- `chat` (response shape `{ success: true, data: { output: [{ text, citations: [...] }], ... } }`).

For detailed input/output examples for Edge Functions, refer to [Edge Function Contracts](docs/EDGE_FUNCTION_CONTRACTS.md).

### Error Handling

The frontend must implement comprehensive error handling to gracefully manage and display errors originating from the API Orchestrator, Supabase Edge Functions, or direct Supabase calls. This includes:

*   Displaying user-friendly error messages.
*   Logging errors for debugging purposes.
*   Implementing retry mechanisms where appropriate.

### Performance

Maintain responsiveness and efficiency consistent with the original frontend (rendering, caching, asset loading). Do not introduce new performance targets in this document; follow the behavior of the reference implementation.

Offline posture:
- After initial model installation, the app should remain usable for local ingestion/chat. The frontend must gracefully handle temporary backend unavailability by surfacing clear statuses and allowing retries.

### Development Environment

A consistent and reproducible development environment is essential. This involves:

*   Cloning the `insights-lm-public-main` repository (or the project’s maintained frontend fork).
*   Installing Node.js dependencies (`npm install` or `yarn install`).
*   Configuring environment variables for Supabase and potentially for mocking backend responses during development.
*   Running the Vite development server (`npm run dev`).

## 6. Development Plan (Frontend)

This plan outlines the phased approach for frontend development, aligning with the backend's progress and the overall project roadmap.

### Phase 1: Setup & Initial Integration (Estimated: S+0 to S+1)

*   **Goal:** Establish a stable frontend development environment and verify basic communication with the API Orchestrator's core services.
*   **Tasks:**
    *   Clone the `insights-lm-public-main` repository and set up the local development environment.
    *   Install all necessary Node.js dependencies.
    *   Configure the Supabase client (`@supabase/supabase-js`) to connect to the local Supabase instance.
    *   Verify successful user authentication and session management.
    *   Implement a basic health check call from the frontend to the API Orchestrator (via its corresponding Edge Function) to confirm connectivity.
    *   Set up a mocking layer for API Orchestrator responses (based on the defined API contracts) to enable parallel development without full backend dependency.
*   **Deliverables:** A running frontend development server, successful user authentication, and verified mocked API calls for core functionalities.

### Phase 2: Core Feature Integration (Estimated: S+1 to S+3)

*   **Goal:** Integrate the frontend with the already implemented core functionalities of the API Orchestrator (document processing and chat RAG).
*   **Tasks:**
    *   Adapt the existing document upload and processing UI to correctly trigger the `process-document` Supabase Edge Function.
    *   Update the frontend to accurately display the real-time processing status of documents and present the indexed content.
    *   Integrate the chat user interface with the `chat` Supabase Edge Function (naming aligned with backend), ensuring messages are sent and responses are received correctly.
    *   Verify the accurate display of AI-generated responses, including the rendering of citations.
    *   Ensure proper persistence and display of chat history within the frontend.
*   **Deliverables:** Fully functional document ingestion and AI-powered chat features, integrated with the local API Orchestrator.

### Phase 3: New Feature Integration (Estimated: S+3 to S+5)

*   **Goal:** Integrate the frontend with the new functionalities being developed in the API Orchestrator (Additional Sources Ingestion and Audio Generation).
*   **Tasks:**
    *   Develop new UI components for inputting "copied text" and "multiple website URLs" as part of the additional sources ingestion.
    *   Implement the logic to trigger the `process-additional-sources` Supabase Edge Function with the appropriate payload for these new source types, and hide these UI controls behind a feature flag until backend availability in the target environment.
    *   Develop UI elements to trigger the `generate-audio` Supabase Edge Function.
    *   Implement an integrated audio playback component within the frontend to play generated audio files.
    *   Ensure the frontend accurately displays the processing status for new ingestion types and audio generation.
*   **Deliverables:** Functional user interfaces for additional sources ingestion and audio generation, fully integrated with the backend.

### Phase 4: Testing & Refinement (Estimated: S+5 to S+6)

*   **Goal:** Ensure the overall stability, performance, and user experience of the integrated frontend.
*   **Tasks:**
    *   Conduct comprehensive end-to-end testing of all frontend features in conjunction with the fully integrated backend.
    *   Identify and address any UI/UX bugs, inconsistencies, or usability issues.
    *   Optimize frontend performance, including bundle size reduction, lazy loading of components, and efficient data rendering.
    *   Update any frontend-specific documentation or user guides as needed.
*   **Deliverables:** A stable, high-performing, and user-friendly frontend application, ready for release.

## 7. Dependencies & Risks

### Dependencies

*   **Stable API Orchestrator (Backend):** The frontend's development is heavily dependent on the backend providing stable, well-defined, and consistent API contracts.
*   **Functional Supabase Instance:** A locally running Supabase instance (PostgreSQL, Storage, Edge Functions) is crucial for both development and testing.
*   **`insights-lm-public-main` Repository:** Access to and stability of the `insights-lm-public-main` GitHub repository (the base frontend project) is a prerequisite.

### Risks

*   **Backend API Contract Changes:** Unforeseen or frequent changes to the backend API contracts could necessitate significant rework on the frontend, leading to delays.
*   **Performance Bottlenecks:** Performance issues could arise from either the frontend's rendering, inefficient data fetching, or slow backend responses, requiring optimization efforts.
*   **Complex Asynchronous Operations:** Managing the state and feedback for complex asynchronous operations (e.g., long-running document processing) can be challenging and prone to bugs.
*   **Environment Setup Discrepancies:** Inconsistencies between development, testing, and production environments could lead to integration issues.
*   **Secrets Exposure:** Accidental exposure of server-side secrets (e.g., `NOTEBOOK_GENERATION_AUTH`) in the frontend. Mitigation: route all sensitive calls via Edge Functions.

## 8. Success Metrics

The success of the frontend development will be measured by:

*   **Feature Functionality:** All specified frontend features are fully functional and meet their requirements.
*   **Seamless Integration:** The frontend integrates flawlessly with the API Orchestrator, with no noticeable communication issues.
*   **User Experience:** Positive user feedback on the intuitiveness, responsiveness, and overall usability of the application.
*   **Performance Targets:** Adherence to defined performance metrics (e.g., page load times, interaction responsiveness) and meeting backend-aligned chat/ingestion latency targets.
*   **Timely Delivery:** Completion of frontend development phases within the estimated timelines.

## Références Claims & Audits (Frontend)

- Voir `docs/DOCUMENTATION_PROJET.md` — section "Claims & Audits (processus et conventions)" pour les règles globales.
- Répertoires: `claims/` (demandes) et `audit/` (vérifications) — utiles pour tracer les sujets impactant le FE (contrats, rendu citations, états UI, erreurs).
- Templates:
  - Claim: `claims/TEMPLATE_CLAIM.md`
  - Audit: `audit/TEMPLATE_AUDIT.md`
- Nommage (résumé):
  - Claims: `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-claim[_resubmit-<n>]_v<maj.min>.md`
  - Audits: `YYYYMMDD_tm-<ids>-team-<nn>-<team-name>-<scope>-audit_v<maj.min>.md`
- Front‑matter YAML requis: `title, doc_kind, team, team_name, tm_ids, scope, status, version, author, related_files`.
- Exigences de conformité:
  - Inclure au moins une ligne `#TEST:` pointant vers des preuves (tests, logs, artefacts)
  - Inclure la section `## Limitations` dans chaque document
- Rappel gouvernance:
  - Flux Task‑Master: SPEC → IMPL → TEST → AUDIT
  - Ne pas mettre le statut dans le nom de fichier; l’indiquer dans le front‑matter

#TEST: docs/spec/README.md
