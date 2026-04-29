"""One-time script to create the PostgreSQL database."""
import asyncio
import asyncpg


async def create_db():
    try:
        # Connect to postgres default DB to create our app DB
        conn = await asyncpg.connect(
            host="localhost",
            port=5433,
            user="postgres",
            password="ajmal1003",
            database="postgres",
        )
        # Check if exists
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = 'job_portal_db'"
        )
        if exists:
            print("✅ Database 'job_portal_db' already exists.")
        else:
            await conn.execute("CREATE DATABASE job_portal_db")
            print("✅ Database 'job_portal_db' created successfully!")
        await conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(create_db())
