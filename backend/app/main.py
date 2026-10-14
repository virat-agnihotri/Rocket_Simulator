"""Main FastAPI Application Entrypoint."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.session import init_db
from app.api.simulations import router as simulations_router
from app.api.optimizations import router as optimizations_router
from app.api.missions import router as missions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    init_db()
    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Full-stack scientific simulation and constrained optimization platform for launch vehicle ascent trajectories and Keplerian orbital insertion.",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local development ports and dev tunnels
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend operational readiness."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to the {settings.APP_NAME} API",
        "documentation": "/docs",
        "health": "/health",
    }


# Include computational routers
app.include_router(simulations_router, prefix="/api")
app.include_router(optimizations_router, prefix="/api")
app.include_router(missions_router, prefix="/api")
