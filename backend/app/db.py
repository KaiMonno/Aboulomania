from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# pool_pre_ping: Neon silently closes idle pooled connections server-side
# (no documented timeout to tune a pool_recycle against - confirmed no
# such value is published), so a connection sitting in the pool can go
# stale before the app ever tries to use it, surfacing as
# asyncpg.exceptions.InterfaceError: connection is closed on whatever
# request draws it next (seen live on /games/facets in production).
# pre_ping tests each connection with a lightweight query before handing
# it to a request and transparently replaces it if that fails, instead of
# letting the stale connection reach application code as an error.
engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
