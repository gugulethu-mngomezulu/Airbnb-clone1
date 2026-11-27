from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.orm import sessionmaker

from .config import Settings
from .database import create_db_engine
from .stays import router as stays_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    engine = create_db_engine(Settings())
    app.state.engine = engine
    app.state.session_factory = sessionmaker(bind=engine, expire_on_commit=False)
    try:
        yield
    finally:
        engine.dispose()


app = FastAPI(title="Stay API", lifespan=lifespan)
app.include_router(stays_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
