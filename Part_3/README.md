# Whisper Transcription with Muna

A simple React app that transcribes audio files using Whisper via Muna.

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

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

This app implements audio transcription similar to the object-detection example but adapted for Whisper:

### Architecture

1. **Audio Upload**: Users can drag & drop or select audio files (WAV, MP3, M4A, FLAC, OGG, WebM)

2. **Audio Processing**: The `useAudioUpload` hook automatically converts uploaded audio to:
   - 16 kHz sample rate
   - Mono channel (if stereo/multi-channel)
   - Float32Array format

3. **Muna Prediction**: Calls the `@my-muna-id/whisper` predictor with:
   - Input: 2D array with shape `(1, N)` where N is the number of audio samples
   - Output: String containing the transcribed text

4. **API Route**: The `/api/predictions` route handles authentication with Muna using the server-side access key, keeping it secure and never exposing it to the browser

### File Structure

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

## Expected Whisper Predictor Interface

The app expects a Muna predictor at `@my-muna-id/whisper` with:

**Input:**
- `audio`: 2D array (shape: `(1, N)`) of audio samples at 16kHz sample rate

**Output:**
- String containing the transcribed text

This matches the interface of the Python function in `/home/anon/Work/fxn.ai/Code/src/current/py2cpp/test/py/whisper_onnx.py:transcribe_audio()`

## Notes

- The Whisper predictor (`@my-muna-id/whisper`) does not exist yet - this app is built in anticipation of its interface
- Audio conversion to 16kHz mono happens in the browser using the Web Audio API
- The actual prediction runs client-side in WebAssembly (similar to the object-detection example)
- The server-side API route only handles authentication and configuration, not the actual inference
