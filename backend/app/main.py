from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import games, profile, recommendations, wishlist

app = FastAPI(title="GameKeep API")

app.add_middleware(
    CORSMiddleware,
    # allow_origin_regex, not a fixed port, because `next dev` silently binds
    # the next free port (3001, 3002, ...) whenever 3000 is already taken by
    # another process - a hardcoded "localhost:3000" then fails every
    # frontend fetch with a browser-side CORS error that looks identical to
    # the backend being down, with no server-side log to point at why.
    allow_origin_regex=r"http://localhost:\d+",
    # Additive, not a replacement - production origin(s) from
    # CORS_ALLOWED_ORIGINS (see config.py), empty/none in dev. CORSMiddleware
    # allows a request matching EITHER allow_origin_regex OR allow_origins.
    allow_origins=[o.strip() for o in get_settings().cors_allowed_origins.split(",") if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router)
app.include_router(games.router)
app.include_router(profile.router)
app.include_router(wishlist.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
