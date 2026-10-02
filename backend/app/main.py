import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.services.seed_data import seed_database
from app.bot.bot import start_bot, stop_bot

from app.api.auth import router as auth_router
from app.api.exercises import router as exercises_router
from app.api.programs import router as programs_router
from app.api.workouts import router as workouts_router
from app.api.analytics import router as analytics_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gym_app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables and seed exercises
    logger.info("📦 Инициализация базы данных...")
    await init_db()

    async with AsyncSessionLocal() as session:
        await seed_database(session)
    logger.info("✅ База данных инициализирована и заполнена упражнениями.")

    # Start Telegram Bot polling in background
    await start_bot()

    yield

    # Shutdown
    await stop_bot()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for WebApp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(exercises_router, prefix=settings.API_V1_STR)
app.include_router(programs_router, prefix=settings.API_V1_STR)
app.include_router(workouts_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)


@app.get("/health")
async def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}


# Mount frontend dist static files if built
frontend_dist_path = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)
if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return
        index_file = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
