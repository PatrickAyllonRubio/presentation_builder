import os
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])

GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"

VOICE_CONFIGS = {
    "hombre": {
        "languageCode": "es-US",
        "name": "es-US-Chirp3-HD-Algenib",
    },
    "mujer": {
        "languageCode": "es-US",
        "name": "es-US-Chirp3-HD-Aoede",
    },
}


class TTSRequest(BaseModel):
    text: str
    voice: str = "hombre"          # "hombre" | "mujer"
    speaking_rate: float = 1.0
    pitch: float = 0.0


@router.post("/synthesize")
async def synthesize(body: TTSRequest):
    """
    Proxy hacia Google TTS. La API key se lee del .env del servidor,
    nunca se expone al frontend.
    """
    api_key = os.getenv("GOOGLE_TTS_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="API key de Google TTS no configurada en el servidor")

    voice_cfg = VOICE_CONFIGS.get(body.voice, VOICE_CONFIGS["hombre"])
    speaking_rate = 1.04 if body.voice == "hombre" else 1.0

    payload = {
        "input": {"text": body.text},
        "voice": {
            "languageCode": voice_cfg["languageCode"],
            "name": voice_cfg["name"],
        },
        "audioConfig": {
            "audioEncoding": "LINEAR16",
            "speakingRate": body.speaking_rate or speaking_rate,
            "pitch": body.pitch,
            "sampleRateHertz": 24000,
            "effectsProfileId": ["small-bluetooth-speaker-class-device"],
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            GOOGLE_TTS_URL,
            params={"key": api_key},
            json=payload,
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    data = resp.json()
    # Devuelve el audio en base64 — el frontend lo convierte a MP3 igual que antes
    return {"audioContent": data.get("audioContent", "")}
