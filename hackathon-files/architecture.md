# VividLaunch — System Architecture

This outlines the high-level architecture and data flow for VividLaunch, showing how components interact across logical layers from the user interface down to the AI models and infrastructure.

```mermaid
flowchart TD
    %% Styling Definitions
    classDef client fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#111827;
    classDef app fill:#e0f2fe,stroke:#38bdf8,stroke-width:2px,color:#0c4a6e;
    classDef ai fill:#fce7f3,stroke:#f472b6,stroke-width:2px,color:#831843;
    classDef infra fill:#fef3c7,stroke:#fbbf24,stroke-width:2px,color:#78350f;
    classDef media fill:#dcfce7,stroke:#4ade80,stroke-width:2px,color:#14532d;
    
    %% 1. Client Layer (Frontend)
    subgraph ClientLayer ["🖥️ Client Layer (Frontend)"]
        UI["Web Interface\n(Next.js / React)"]:::client
        User([User]):::client
        
        User -- "Interacts, Configures & Uploads" --> UI
    end

    %% 2. Application Layer (Backend / API)
    subgraph AppLayer ["⚙️ Application Layer (Backend / API)"]
        API_Auth["Auth Middleware\n(NextAuth)"]:::app
        API_Gen["Generation Router\n(POST /api/generate)"]:::app
        API_Media["Media Router\n(POST /api/render)"]:::app
        API_Dist["Distribution API\n(POST /api/publish)"]:::app
        
        UI -- "Authenticates" --> API_Auth
        UI -- "Requests Content\n(Text/JSON)" --> API_Gen
        UI -- "Triggers Video Build" --> API_Media
        UI -- "Publishes Content" --> API_Dist
    end

    %% 3. AI Layer (Gemini Integration)
    subgraph AILayer ["🧠 AI Layer (Models & Processing)"]
        Guardrails{"Safety &\nInput Validation"}:::ai
        Gemini["Gemini Core\n(Flash 2.0 / 3.0)"]:::ai
        
        API_Gen -- "1. Secures Prompt & Context" --> Guardrails
        Guardrails -- "2. Validated Prompt" --> Gemini
        Gemini -- "3. Streams JSON/Markdown\n(Creative Output)" --> API_Gen
    end

    %% 4. Media Processing Layer
    subgraph MediaLayer ["🎬 Media Processing Services"]
        MediaWorker["Media Node Worker\n(FFmpeg/Node.js)"]:::media
        TTS["Google Cloud TTS\n(Voice Synthesis)"]:::media
        VisGen["Imagen 3 / Veo 3.1\n(Visual Generation)"]:::media
        
        API_Media -- "Submits Build Payload" --> MediaWorker
        MediaWorker -- "Requests Voiceover" --> TTS
        MediaWorker -- "Requests Missing Assets" --> VisGen
    end

    %% 5. Infrastructure & Database Layer
    subgraph InfraLayer ["☁️ Infrastructure & Database Layer"]
        DB[(Firestore DB\nUser Data & Project Metadata)]:::infra
        Storage[(Cloud Storage\nAssets & Final Media)]:::infra
        DistChannels["Third-Party APIs\n(X, LinkedIn, Hashnode, Dev.to)"]:::infra
        
        %% Database Interactions
        API_Gen -. "Reads Context/Writes Logs" .-> DB
        API_Media -. "Logs Render Status" .-> DB
        API_Dist -. "Fetches Credentials" .-> DB
        
        %% Storage Interactions
        MediaWorker -. "Downloads User Assets" .-> Storage
        MediaWorker -. "Uploads Final Media (.mp4)" .-> Storage
        API_Gen -. "Reads Asset URLs" .-> Storage
    end
    
    %% Distribution Connections
    API_Dist -- "Pushes Final Content" --> DistChannels
```

## Layer Summaries

### 1. Client Layer (Frontend)
The user interface built with Next.js, React, and Tailwind/shadcn. It provides the interactive dashboards (Video, Blog, Social Studios), captures user input, and receives streamed responses from the backend.

### 2. Application Layer (Backend/API)
Serverless Next.js API routes that act as the secure intermediary. They handle authentication, payload validation, and route requests to either the AI models, the media worker, or the external distribution channels.

### 3. AI Layer
The core brain of the system safely isolated behind the API. It utilizes Google's Gemini models for reasoning, structuring storyboards (JSON), and generating long-form copy. Secure guardrails ensure prompts are clean before hitting the model.

### 4. Media Processing Layer
A dedicated Node.js service containing the FFmpeg compositing engine. It orchestrates sub-services like Google Cloud Text-to-Speech (TTS) and Imagen/Veo to assemble video scenes based on the AI's storyboard logic.

### 5. Infrastructure & Database Layer
The foundational Google Cloud services. **Firestore** handles all persistent metadata (user profiles, project briefs, generation history). **Cloud Storage** safely stores the physical files (uploaded images, generated assets, final videos). External publishing APIs sit at the edge to distribute content.
