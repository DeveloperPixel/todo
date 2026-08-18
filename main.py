import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List

# Setup database url from environment or default to PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password123@db:5432/tododb")

# Try to connect to PostgreSQL, fallback to SQLite if connection fails
try:
    if DATABASE_URL.startswith("postgresql"):
        # We try to create the engine and connect. To fail fast, we add a connect timeout.
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        # Test connection
        with engine.connect() as conn:
            pass
    else:
        engine = create_engine(DATABASE_URL)
except Exception:
    print("PostgreSQL connection failed. Falling back to SQLite local database.")
    DATABASE_URL = "sqlite:///./todo.db"
    # sqlite needs check_same_thread=False
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# SQLAlchemy Todo Model
class DBTodo(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    completed = Column(Boolean, default=False)

# Create tables
Base.metadata.create_all(bind=engine)

# FastAPI initialization
app = FastAPI(title="Todo App API")

# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class TodoBase(BaseModel):
    title: str
    completed: bool = False

class TodoCreate(BaseModel):
    title: str

class TodoUpdate(BaseModel):
    title: str = None
    completed: bool = None

class Todo(TodoBase):
    id: int

    class Config:
        from_attributes = True

# API Routes
@app.get("/todos", response_model=List[Todo])
def read_todos(db: Session = Depends(get_db)):
    return db.query(DBTodo).order_by(DBTodo.id.asc()).all()

@app.post("/todos", response_model=Todo, status_code=status.HTTP_201_CREATED)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    db_todo = DBTodo(title=todo.title, completed=False)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.put("/todos/{todo_id}", response_model=Todo)
def update_todo(todo_id: int, todo_update: TodoUpdate, db: Session = Depends(get_db)):
    db_todo = db.query(DBTodo).filter(DBTodo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    if todo_update.title is not None:
        db_todo.title = todo_update.title
    if todo_update.completed is not None:
        db_todo.completed = todo_update.completed
        
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = db.query(DBTodo).filter(DBTodo.id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(db_todo)
    db.commit()
    return None

# Serve index.html at root
@app.get("/")
def get_index():
    return FileResponse("static/index.html")

# Mount remaining static files (css, js, assets)
app.mount("/", StaticFiles(directory="static"), name="static")
