"""One-off copy of the enriched games catalog (games + curated_list_games)
from the local dev Postgres to a hosted Postgres (e.g. Neon), ahead of
deploy. Scope is deliberate: this is the shared, expensive-to-regenerate
asset (IGDB + HLTB + LLM enrichment) that shouldn't be local-only before
shipping. Per-user tables (users, wishlist_items, user_library_items,
user_preferences) are intentionally NOT copied - see README.md "no shared
database between developers"; those stay per-developer/local, and a real
prod deploy gets real prod user data, not a copy of anyone's dev data.

Run schema migrations against the target FIRST (creates all tables,
including the per-user ones left empty - this only skips copying their
data, not their schema):

    DATABASE_URL_SYNC=postgresql+psycopg2://...<neon-host>.../dbname alembic upgrade head

Then copy the data:

    python -m app.scripts.export_games_catalog "postgresql+asyncpg://...<neon-host>.../dbname"

Safe to re-run - upserts by primary key, same pattern as
scripts/sync_igdb.py's upsert_games.
"""

import argparse
import asyncio
import logging

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.db import async_session_factory
from app.models import CuratedListGame, Game

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def run(target_url: str) -> None:
    target_engine = create_async_engine(target_url, echo=False)
    target_session_factory = async_sessionmaker(target_engine, expire_on_commit=False)

    async with async_session_factory() as source_session:
        games = list((await source_session.execute(select(Game))).scalars().all())
        curated = list((await source_session.execute(select(CuratedListGame))).scalars().all())

    logger.info("Copying %d games and %d curated-list rows to target", len(games), len(curated))

    game_columns = [c.name for c in Game.__table__.columns]
    game_rows = [{col: getattr(g, col) for col in game_columns} for g in games]
    curated_rows = [{"game_id": c.game_id} for c in curated]

    async with target_session_factory() as dest_session:
        if game_rows:
            stmt = insert(Game).values(game_rows)
            update_cols = {col: stmt.excluded[col] for col in game_columns if col != "id"}
            stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols)
            await dest_session.execute(stmt)

        if curated_rows:
            stmt = insert(CuratedListGame).values(curated_rows)
            stmt = stmt.on_conflict_do_nothing(index_elements=["game_id"])
            await dest_session.execute(stmt)

        await dest_session.commit()

    logger.info("Done - %d games, %d curated-list rows on target.", len(game_rows), len(curated_rows))
    await target_engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target_url", help="Destination Postgres URL (asyncpg driver, e.g. postgresql+asyncpg://...)")
    args = parser.parse_args()
    asyncio.run(run(args.target_url))


if __name__ == "__main__":
    main()
