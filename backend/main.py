from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SG Exercise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    logger.info("Health check called")
    return {"status": "ok"}

@app.get("/api/message")
def get_message():
    msg = os.getenv("APP_MESSAGE", "Hello from the backend!")
    logger.info(f"Message endpoint called, returning: {msg}")
    return {"message": msg}
