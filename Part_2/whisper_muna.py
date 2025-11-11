#
#   Muna
#   Copyright © 2025 NatML Inc. All Rights Reserved.
#

from huggingface_hub import hf_hub_download
from muna import compile, Parameter, Sandbox
from muna.beta import OnnxRuntimeInferenceSessionMetadata
from numpy import array, float32, int64, ndarray, zeros
from onnxruntime import InferenceSession
from transformers import AutoTokenizer
from typing import Annotated

# Download necessary model files from Hugging Face Hub
mel_model_path = hf_hub_download(
    repo_id="unity/inference-engine-whisper-tiny",
    filename="models/logmel_spectrogram.onnx"
)
encoder_model_path = hf_hub_download(
    repo_id="csukuangfj/sherpa-onnx-whisper-small.en",
    filename="small.en-encoder.onnx"
)
decoder_model_path = hf_hub_download(
    repo_id="csukuangfj/sherpa-onnx-whisper-small.en",
    filename="small.en-decoder.onnx"
)

# Load the models using the onnxrutime
mel_session = InferenceSession(mel_model_path)
encoder_session = InferenceSession(encoder_model_path)
decoder_session = InferenceSession(decoder_model_path)
# Load a tokenizer
tokenizer = AutoTokenizer.from_pretrained("openai/whisper-small.en")
# Set the value of special tokens
START_OF_TRANSCRIPT_ID = tokenizer.convert_tokens_to_ids("<|startoftranscript|>")
EN_ID = tokenizer.convert_tokens_to_ids("<|en|>")
TRANSCRIBE_ID = tokenizer.convert_tokens_to_ids("<|transcribe|>")
NO_TIMESTAMPS_ID = tokenizer.convert_tokens_to_ids("<|notimestamps|>")
EOS_TOKEN_ID = tokenizer.eos_token_id

@compile(
    tag="@anon/whisper-small-en",
    description="Transcribe audio to text with Whisper.",
    sandbox=Sandbox().pip_install("huggingface_hub", "onnxruntime", "transformers"),
    metadata=[
        OnnxRuntimeInferenceSessionMetadata(session=mel_session, model_path=mel_model_path),
        OnnxRuntimeInferenceSessionMetadata(session=encoder_session, model_path=encoder_model_path),
        OnnxRuntimeInferenceSessionMetadata(session=decoder_session, model_path=decoder_model_path),
    ]
)
def transcribe_audio(
    audio: Annotated[
        ndarray,
        Parameter.Generic(
            description="Raw audio array with shape (1, 480000) at 16kHz sample rate."
        )
    ]
) -> Annotated[str, Parameter.Generic(description="Transcribed text from audio.")]:
    # Run MEL spectrogram extraction
    mel_features = mel_session.run(None, {"audio": audio})[0]
    # Run encoder to get cross-attention keys/values
    cross_k, cross_v = encoder_session.run(None, {"mel": mel_features})
    # Initialize KV caches for decoder self-attention
    # Shape: [12, 1, 448, 768] where 12 is number of layers, batch_size=1
    self_k_cache = zeros((12, 1, 448, 768), dtype=float32)
    self_v_cache = zeros((12, 1, 448, 768), dtype=float32)
    # Start with proper Whisper decoder prompt (using precomputed token IDs)
    start_tokens = [START_OF_TRANSCRIPT_ID, EN_ID, TRANSCRIBE_ID, NO_TIMESTAMPS_ID]
    tokens = array([start_tokens], dtype=int64)
    generated_ids = [13]  # Put a starting value in the results list to set type
    offset = 0
    max_length = 100
    for i in range(max_length):
        # Run decoder
        decoder_outputs = decoder_session.run(
            None,
            {
                "tokens": tokens,
                "in_n_layer_self_k_cache": self_k_cache,
                "in_n_layer_self_v_cache": self_v_cache,
                "n_layer_cross_k": cross_k,
                "n_layer_cross_v": cross_v,
                "offset": array([offset], dtype=int64)
            }
        )
        logits = decoder_outputs[0]
        self_k_cache = decoder_outputs[1]
        self_v_cache = decoder_outputs[2]
        # Get next token (last token in sequence for batch 0)
        # logits shape: (batch_size=1, seq_len, vocab_size)
        # Using [0, -1] gives us the vocab logits for the last position (1D array)
        next_token_logits = logits[0, -1,]
        next_token_id = int(next_token_logits.argmax(0).item())
        if next_token_id == EOS_TOKEN_ID:
            break
        generated_ids.append(next_token_id)
        # For next iteration, only pass the new token
        tokens = array([[next_token_id]], dtype=int64)
        # Offset should track position in the sequence
        offset += len(start_tokens) if i == 0 else 1
        # break
    # Decode token IDs to text using tokenizer (trim off the first starting element)
    return tokenizer.decode(generated_ids[1:], skip_special_tokens=True)

if __name__ == "__main__":
    from librosa import load as load_audio
    from numpy import reshape
    # Load audio with conversion to mono and resamples to Whisper's 16kHz)
    audio = load_audio("jfk.wav", sr=16000, mono=True)[0]
    # Pad/trim to 30 seconds (480,000 samples at 16kHz)
    target_length = 480000
    if len(audio) < target_length:
        audio = array(list(audio) + [0.0] * (target_length - len(audio)), dtype=float32)
    else:
        audio = audio[:target_length].astype(float32)
    # Reshape to (1, 480000)
    audio = reshape(audio, (1, 480000))
    # Transcribe to get text
    transcription = transcribe_audio(audio)
    print(f"Transcription: {transcription}")
