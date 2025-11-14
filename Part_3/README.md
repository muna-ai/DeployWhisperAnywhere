# Whisper Transcription with Muna

This repository contains some example code for Part 3 of a tutorial on [Deploying Whisper Anywhere with Muna]().  

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your Muna access key:
Edit `.env.local` and set your actual Muna access key:
```
MUNA_ACCESS_KEY=your_actual_muna_access_key
```

3. Edit [src/app/page.tsx](src/app/page.tsx#L57) to replace'@my-muna-id' with your Muna id:
```JavaScript
 tag: '@my-muna-id/whisper'
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

The app demonstrates how to use the Muna predictor for Whisper transcription that we wrote in [Part 1]() and then compiled with Muna in [Part 2](). Details are available in [Part 3]().

### Files 

```
Part3/
├── src/
│   ├── app/
│   │   ├── api/predictions/route.ts  # Server-side API route for Muna auth
│   │   ├── page.tsx                   # Main UI component
│   │   ├── layout.tsx                 # App layout
│   │   └── globals.css                # Global styles
│   └── hooks/
│       └── useAudioUpload.ts          # Audio upload & conversion hook
├── package.json
├── tsconfig.json
├── next.config.ts
└── .env.local                          # Environment variables (not committed)
```

## The Muna Whisper Predictor Interface

The app uses a Muna Whsiper predictor with:

**Input:**
- `audio`: 2D array (shape: `(1, N)`) of audio samples at 16kHz sample rate

**Output:**
- String containing the transcribed text

## Support

For questions and support, visit the Muna team on [our Slack community](https://muna.ai/slack).
