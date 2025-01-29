from fastapi import FastAPI, BackgroundTasks, Body
from fastapi.middleware.cors import CORSMiddleware
import requests
from pydantic import BaseModel
from gen_kywrds import get_keywords  

class TopicRequest(BaseModel):
    topic: str

app = FastAPI()
node_server_url = "http://localhost:3000/callback"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_and_callback(topic: str, callback_url: str):
 
    keywords = get_keywords(topic) 

    payload = {"topic": topic, "keywords": keywords}
    try:
        requests.post(callback_url, json=payload, timeout=10)
    except requests.RequestException as e:
        print(f"Failed to call back {callback_url}: {e}")

@app.post("/queue-keywords")
def queue_keywords(
    topic: str = Body(..., embed=True),  
    background_tasks: BackgroundTasks = None
):
    background_tasks.add_task(process_and_callback, topic, node_server_url)
    return {"message": f"Keywords generation scheduled for topic '{topic}'."}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
