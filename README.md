# VividLaunch 🚀

VividLaunch is an autonomous marketing platform that transforms a single product description or landing page URL into a comprehensive, multi-channel marketing campaign in seconds. 

Acting as an AI-powered "Creative Director", VividLaunch leverages **Google's Gemini 3.1 Pro/Flash**, **Vertex AI (Imagen 3 and Veo 3.1)**, and scalable **Google Cloud Infrastructure** to orchestrate cinematic promo videos, SEO-optimized long-form blogs, and platform-aware social media marketing packs.

---

## What It Is & How It Works

### 1. The Context Analyzer (Brand DNA extraction)
Users begin by providing a target website URL, an existing blog link, or raw text. Utilizing **Gemini 3.1 Pro**, the Context Analyzer automatically scrapes and analyzes the content to extract a unique "Brand DNA" profile (determining Tone, Formality, Humor, and Target Audience). 

### 2. The Video Studio
The core of VividLaunch is its generative storyboard pipeline. Users configure their campaign pacing (Hook, Promo, Story, Masterclass) and select their preferred rendering engine:
*   **Motion Stills (Low Cost):** AI-driven dynamic slideshows utilizing **Imagen 3**.
*   **Cinematic AI (Premium):** Full native-quality motion generated with **Veo 3.1**.

Gemini acts as the Creative Director, generating a structured JSON storyboard allocating visuals, voiceover script chunks, and dynamic text overlays. A custom **Standalone FFmpeg Node Worker** then kicks in to synchronously download assets from **Cloud Storage**, synthesize voiceovers using **Google Cloud Text-to-Speech (TTS)**, generate missing imagery via Imagen 3, and stitch the final `.mp4` video together.

### 3. The Blog & Social Studios
*   **Blog Engine:** Generates rich, SEO-optimized long-form content. Users can run in *Automatic Synthesis* mode (using the project's brand DNA) or *Manual Mode* (prompting specific angles). Drafts are saved persistently in **Firestore**.
*   **Social Studio:** Platform-aware (X, LinkedIn, Instagram) content generator. Output ranges from single posts to multi-platform *Content Packs* and *A/B Strategy Variants*.
*   **Distribution Connectors:** A centralized dispatcher capable of pushing approved content natively via third-party APIs (Medium, Hashnode, Dev.to).

---

## System Architecture

VividLaunch employs a robust serverless Next.js architecture, securely abstracting the AI inference and Media composition away from the client browser.

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
        Gemini["Gemini Core\n(Flash 3.0 / Pro 3.1)"]:::ai
        
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

---

## 🛠 Hackathon Setup Instructions

To run this application locally and securely access the associated Google Cloud and Vertex AI services, please follow these precise environmental setup instructions.

### Step 1: Create the Project & Enable APIs
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown (top left) and select **New Project**. Name it `VividLaunch`.
3. Once created, use the search bar at the top to find and **Enable** these APIs:
   - **Cloud Firestore API** (Select "Native Mode" when prompted).
   - **Cloud Storage API**.
   - **Secret Manager API**.
   - **Cloud Pub/Sub API**.
   - **Cloud Tasks API**.
   - **Vertex AI API** (For Imagen 3 and Veo).
   - **Cloud Text-to-Speech API**.

### Step 2: Create the Service Account & Key
1. Navigate to **IAM & Admin > Service Accounts**.
2. Click **Create Service Account**. Name it `vividlaunch-backend`.
3. **Grant Access**: Assign the role **Editor** (for development) or specific roles like *Storage Admin*, *Cloud Datastore User*, and *Secret Manager Secret Accessor*.
4. Once created, click on the service account email → **Keys** tab → **Add Key** → **Create New Key**.
5. Select **JSON** and download the file. *Keep this file safe; do not commit it to GitHub.*

### Step 3: Configure `.env.local`
Open your downloaded JSON key file and meticulously copy the values into a `.env.local` file at the root of the project.

> [!WARNING]
> **The Private Key Trap:** The `private_key` string in the JSON file contains `\n` characters. If you paste it incorrectly, the application will crash with an "Invalid PEM" error on startup.

Format your `.env.local` exactly like this:

```bash
GCP_PROJECT_ID="vividlaunch"
GCP_CLIENT_EMAIL="vividlaunch-backend@vividlaunch-xxxxxx.iam.gserviceaccount.com"

# IMPORTANT: Wrap the key in double quotes and keep it on ONE line.
# Ensure the \n characters are literally in the string.
GCP_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_LONG_KEY_HERE\n-----END PRIVATE KEY-----\n"

GCS_BUCKET_NAME="vividlaunch-assets"
GCP_LOCATION_ID="us-central1"
```

### Step 4: Create the Storage Bucket
1. Go to **Cloud Storage > Buckets**.
2. Click **Create**.
3. **Name:** `vividlaunch-assets` (or whatever matching name you set in your `.env.local` above).
4. **Region:** Choose a region close to you or your target users (e.g., `us-central1`).
5. Keep other settings as default for now.

---
**Run the local development server:**
```bash
npm install
npm run dev
```
