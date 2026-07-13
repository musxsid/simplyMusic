# SimplyMusic Architecture & Sequence Flow

This document details the complete end-to-end architecture and sequence flow of the SimplyMusic application, including all the microservices, frontend systems, and newly implemented features (like the visualizer, voice search, and Gateway-level Zero Trust security with the Backend-For-Frontend pattern).

## Microservices Overview

*   **React Frontend:** The client-facing application featuring the Web Audio API visualizer, Drag-and-Drop library management, and Analytics dashboard. It now securely communicates with the API Gateway using session cookies, removing the need to manage JWTs directly in the browser.
*   **Keycloak:** Handles Identity and Access Management (OAuth2/OIDC) and provides the JWKS (JSON Web Key Set) for token cryptographic verification.
*   **API Gateway:** Spring Cloud Gateway running on port `8080`. Acts as a Backend-For-Frontend (BFF) and the primary security checkpoint (OAuth2 Client & Resource Server). It handles the OAuth2 Login flow, maintains user sessions, validates JWTs, performs user-based rate limiting, handles CORS (with credentials), and executes dynamic routing via Token Relay.
*   **Eureka Server:** Netflix Eureka for Service Discovery running on port `8761`.
*   **Music Service (backend):** Core CRUD service running on port `8081` for managing Tracks, Playlists, Favourites, and audio file streaming. Implements defense-in-depth by re-validating the relayed JWT.
*   **Enrichment Service:** Handles AI Voice Search audio fingerprinting and metadata enrichment.
*   **Analytics Service:** Collects asynchronous telemetry data (play counts, listening time, genre preferences) to power the user dashboard.

## High Level Architecture Diagram

This flowchart represents the structural topology of the system. It has been color-coded and organized by infrastructure layers to clearly illustrate how the React Frontend negotiates authentication via the BFF pattern, how the API Gateway secures the perimeter, and how data flows through the microservices.

```mermaid
graph TD
    %% Styling for maximum contrast and readability on white backgrounds
    classDef frontend fill:#E3F2FD,stroke:#1565C0,stroke-width:2px,color:#000
    classDef identity fill:#FFF3E0,stroke:#E65100,stroke-width:2px,color:#000
    classDef gateway fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px,color:#000
    classDef service fill:#F3E5F5,stroke:#6A1B9A,stroke-width:2px,color:#000
    classDef storage fill:#ECEFF1,stroke:#455A64,stroke-width:2px,color:#000
    classDef queue fill:#FFFDE7,stroke:#F57F17,stroke-width:2px,color:#000

    subgraph "Frontend Layer"
        Client[React Frontend <br/> ⚡ Port 5173]:::frontend
    end

    subgraph "Identity & Discovery Layer"
        Keycloak[Keycloak IAM <br/> 🔐 Port 9090]:::identity
        Eureka[Eureka Server <br/> 📍 Port 8761]:::identity
    end

    subgraph "Edge / Gateway Layer"
        Gateway[Spring Cloud API Gateway <br/> 🛡️ Port 8080 <br/> OAuth2 BFF & Resource Server]:::gateway
    end

    subgraph "Microservices Core Layer"
        Music[Music Service <br/> 🎵 Port 8081]:::service
        Analytics[Analytics Service <br/> 📊 Port 8082]:::service
        Enrichment[Enrichment Service <br/> 🎙️ Port 8083]:::service
    end

    subgraph "Data & Event Persistence Layer"
        Mongo[(MongoDB <br/> 🗄️ Port 27017)]:::storage
        Minio[(MinIO Object Storage <br/> 📦 Port 9000)]:::storage
        RabbitMQ[[RabbitMQ Message Broker <br/> 📨 Port 5672]]:::queue
    end

    %% Client Interactions
    Client -- "1. Login & API Requests (Session Cookie)" --> Gateway
    
    %% Gateway Interactions
    Gateway -- "2. OAuth2 Login / Token Exchange" --> Keycloak
    Gateway -. "Verify JWT via JWKS" .-> Keycloak
    Gateway -. "Lookup Routes" .-> Eureka
    Gateway -- "lb://SIMPLYMUSIC" --> Music
    Gateway -- "lb://analytics-service" --> Analytics
    Gateway -- "lb://enrichment-service" --> Enrichment

    %% Microservices to Eureka
    Music -. "Register heartbeat" .-> Eureka
    Analytics -. "Register heartbeat" .-> Eureka
    Enrichment -. "Register heartbeat" .-> Eureka

    %% Database and Queue Interactions
    Music -- "Track/Playlist Metadata" --> Mongo
    Music -- "Audio Files / Images" --> Minio
    Analytics -- "Consume Stats" --> RabbitMQ
    Music -- "Publish Play Events" --> RabbitMQ
```

## Detailed Application Sequence Diagram

The following sequence diagram outlines the exact order of operations. It highlights the new Backend-For-Frontend (BFF) Zero Trust Security model, showing where token relay and cryptographic validations occur before data is persisted.

```mermaid
sequenceDiagram
    autonumber
    
    participant User
    participant App as React Frontend
    participant GW as API Gateway (8080)
    participant IAM as Keycloak (9090)
    participant Registry as Eureka (8761)
    participant Core as Music Service (8081)
    participant AI as Enrichment Service (8083)
    participant DB as MongoDB / MinIO

    %% Phase 1: Auth
    Note over User, IAM: --- Phase 1: Authentication (BFF Pattern) & Zero Trust Initialization ---
    User->>App: Clicks Login
    App->>GW: Redirect to /oauth2/authorization/keycloak
    GW->>IAM: Initiate OAuth2 Authorization Code Flow
    IAM-->>User: Present Login Page
    User->>IAM: Enter Credentials
    IAM-->>GW: Redirect with Auth Code
    GW->>IAM: Exchange Code for JWT Tokens
    GW-->>App: Set Session Cookie & Redirect to App
    
    %% Phase 2: Core Request
    Note over User, DB: --- Phase 2: Secure API Routing (e.g., Upload Track or Reorder Playlist) ---
    App->>GW: POST /api/v1/music (with Session Cookie)
    
    Note over GW, IAM: Security & Rate Limit Check
    GW->>IAM: Fetch JWKS (Public Keys) if not cached
    Note over GW: 1. Verify Session & Extract JWT<br/>2. Mathematically verify JWT Signature<br/>3. Extract Principal (User ID)<br/>4. Check Redis Rate Limit (40 per user)
    
    Note over GW, Registry: Dynamic Service Discovery
    GW->>Registry: Request IP for 'SIMPLYMUSIC'
    Registry-->>GW: Returns 192.168.x.x:8081
    
    Note over GW, Core: Token Relay Mechanism
    GW->>Core: Forward Request + Bearer Token (Relayed)
    Note over Core: Defense-in-Depth:<br/>Music Service locally verifies JWT again
    Core->>DB: Save Track Metadata & Audio Blob
    DB-->>Core: Acknowledge Save
    Core-->>App: 200 OK (Track Created)
    
    %% Phase 3: Audio Streaming
    Note over User, Core: --- Phase 3: Audio Streaming & Focus Mode Visualizer ---
    User->>App: Clicks Play
    App->>GW: GET /api/v1/music/stream/{id} (with Session Cookie)
    GW->>Core: Route Request (Token Relayed)
    Core-->>App: Stream Audio Chunks (Bytes)
    Note over App: Web Audio API extracts FFT Data<br/>Canvas API renders reactive particles
    
    %% Phase 4: AI Voice Search
    Note over User, Core: --- Phase 4: AI Voice Search (Hum/Sing to Search) ---
    User->>App: Hums into Microphone
    Note over App: MediaRecorder captures Audio Blob
    App->>GW: POST /api/v1/enrichment/identify (with Session Cookie)
    GW->>AI: Token Relay & Route
    Note over AI: Execute Audio Fingerprinting Algorithm
    AI-->>App: Return Matched Song ID & Confidence %
    App->>GW: GET /api/v1/music/search (Query by matched ID)
    GW->>Core: Route Request
    Core-->>App: Return Full Track Details
```

## Key Implemented Features Breakdown

### 1. The Focus Mode Visualizer
*   **Mechanism:** Connects an HTML5 `<audio>` element to the Web Audio API's `AnalyserNode`.
*   **Logic:** Extracts Fast Fourier Transform (FFT) arrays 60 times a second to capture real-time audio frequencies.
*   **Rendering:** Uses a 2D HTML Canvas to draw thousands of particles that scale, pulse, and animate directly matching the frequency amplitude of the music. Includes a physics-based "magnetic repulsion" effect calculated via the Pythagorean theorem tracking the user's mouse coordinates, creating an interactive and immersive experience.
*   **Theming:** Automatically detects the UI's Light/Dark mode and extracts the dynamic ambient color from the currently playing track's metadata/album art to tint the visualizer particles seamlessly.

### 2. Drag-and-Drop Architecture
*   **Mechanism:** Integrates `@dnd-kit/core` and `@dnd-kit/sortable` to create fluid, accessible, and performant drag-and-drop interactions across the application.
*   **Library:** The main "All Songs" view utilizes a `SortableContext` that turns every row into a `SortableLibraryTrackItem`.
*   **Playlists:** The playlist grid employs a 2D `rectSortingStrategy`, wrapping cards in `SortablePlaylistCard` components to allow full two-dimensional drag-and-drop reorganization of folders and lists.

### 3. Voice Search / Enrichment Integration
*   **Mechanism:** Uses the browser's `MediaRecorder` API to seamlessly capture microphone input chunks as the user hums or sings.
*   **Logic:** Pushes binary audio blobs through the securely authenticated API Gateway to the Spring Boot Enrichment Service where advanced audio fingerprinting and pattern matching occurs.
*   **Feedback Loop:** Triggers an animated, confidence-scored popup in the frontend, allowing the user to immediately jump to the matched song in their library, providing a frictionless AI-assisted search experience.

### 4. Microservice Resilience & Security (Backend-For-Frontend / Zero Trust)
*   **BFF Pattern & Session Management:** Authentication is no longer handled directly in the React frontend. The Spring Cloud API Gateway has been upgraded to act as an OAuth2 Client using the Backend-For-Frontend (BFF) pattern. It manages the OAuth2 Authorization Code flow, creating a secure, HTTP-only session with the frontend via cookies (`allowCredentials=true`).
*   **API Gateway Security:** Acting as an OAuth2 Resource Server (`SecurityWebFilterChain`), the Gateway mathematically verifies Keycloak JWT signatures extracted from the session before any routing occurs, protecting backend services from unauthorized exposure.
*   **User-Based Rate Limiting:** The Gateway's `userKeyResolver` extracts the `Principal.getName()` from the authenticated JWT to assign Redis rate-limiting buckets (e.g., 40 tokens) per actual user account rather than per IP address, preventing shared-network lockouts.
*   **Token Relay & Service Discovery:** Validated tokens are automatically relayed downstream to Eureka-discovered instances (e.g., `lb://SIMPLYMUSIC`) using the `TokenRelay` filter. The Gateway centralizes CORS (allowing `localhost:5173`) while Eureka ensures resilient, horizontally-scalable routing without frontend reconfiguration.
