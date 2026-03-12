from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import init_db, create_event, get_events_to_notify, mark_event_notified, get_events_for_user
from models import EventCreate, EventOut
from notifier import send_notification
import aiosqlite
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scheduler = AsyncIOScheduler()

async def check_and_notify():
    print("Запуск проверки событий...")
    events = await get_events_to_notify()
    for event in events:
        success = send_notification(event["user_id"], event["title"])
        if success:
            await mark_event_notified(event["id"])
            print(f"Событие {event['id']} отмечено как уведомленное")
        else:
            print(f"Не удалось отправить уведомление для события {event['id']}")

@app.on_event("startup")
async def startup():
    await init_db()
    scheduler.add_job(check_and_notify, trigger=IntervalTrigger(minutes=1), id="check_events", replace_existing=True)
    scheduler.start()
    print("Планировщик запущен, проверка каждую минуту")

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/events", response_model=EventOut)
async def create_new_event(event: EventCreate):
    event_time_str = event.event_time.isoformat()
    event_id = await create_event(
        user_id=event.user_id,
        title=event.title,
        event_time=event_time_str
    )
    async with aiosqlite.connect("events.db") as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT id, user_id, title, event_time, notified, created_at FROM events WHERE id = ?",
            (event_id,)
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
    return EventOut(
        id=row["id"],
        user_id=row["user_id"],
        title=row["title"],
        event_time=datetime.fromisoformat(row["event_time"]),
        notified=bool(row["notified"]),
        created_at=datetime.fromisoformat(row["created_at"])
    )

@app.get("/events/{user_id}")
async def get_user_events(user_id: int):
    events = await get_events_for_user(user_id)
    return events

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)