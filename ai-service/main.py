from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.predict import router as predict_router
from routes.duplicate import router as duplicate_router
from routes.health import router as health_router

app = FastAPI(
    title="Civic Lens AI Service",
    description="Python FastAPI Microservice for AI Issue Categorization and Duplicate Detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register AI Microservice Routes
app.include_router(predict_router)
app.include_router(duplicate_router)
app.include_router(health_router)

@app.get("/")
def root():
    return {
        "name": "Civic Lens AI Service API",
        "status": "running",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
