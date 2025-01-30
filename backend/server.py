import asyncio
import os
import json
import logging
from typing import List, Optional, Dict

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Body
from pydantic import BaseModel, ValidationError
from fastapi.middleware.cors import CORSMiddleware
import requests

from twitter import (
    client,
    TweetProcessor,
    load_cookies,
    perform_login_with_retries
)
from gen_kywrds import get_keywords  

logging.basicConfig(
    filename='twitter_bot.log',
    filemode='a',
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.DEBUG  
)

from dotenv import load_dotenv
load_dotenv()

USERNAME = os.getenv("TWITTER_USERNAME")
EMAIL = os.getenv("TWITTER_EMAIL")
PASSWORD = os.getenv("TWITTER_PASSWORD")
COOKIES_FILE = "cookies.json"
MAX_LOGIN_RETRIES = 3
node_server_url = "http://localhost:3000/callback"

app = FastAPI(
    title="Twitter Thread Search API",
    description="API to search Twitter threads based on a topic.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TweetNode(BaseModel):
    text: str
    id: str
    child: Optional["TweetNode"] = None
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True

class ThreadModel(BaseModel):
    thread_id: int
    tweets: TweetNode

class SearchResponse(BaseModel):
    topic: str
    threads: List[ThreadModel]
    top_tweets: Optional[List[ThreadModel]] = None  

class TopicRequest(BaseModel):
    topic: str

TweetNode.update_forward_refs()

tweet_processor = TweetProcessor()

@app.on_event("startup")
async def startup_event():
    logging.info("Starting up the Twitter Backend API...")
    print("🚀 Starting up the Twitter Backend API...")
    login_success = await load_cookies(COOKIES_FILE)
    
    if not login_success:
        login_success = await perform_login_with_retries(USERNAME, EMAIL, PASSWORD)
        if not login_success:
            logging.critical("Failed to log in after multiple attempts.")
            print("🔥 Critical error: Failed to log in after multiple attempts.")
            import sys
            sys.exit(1)
    logging.info("Application startup complete.")
    print("INFO: Application startup complete.")

@app.on_event("shutdown")
async def shutdown_event():
    logging.info("Shutting down the Twitter Backend API...")
    print("🛑 Shutting down the Twitter Backend API...")

def process_keywords(topic: str, callback_url: str):
    keywords = get_keywords(topic)  
    payload = {"topic": topic, "keywords": keywords}
    process_and_callback(payload, callback_url)

def process_and_callback(payload: object, callback_url: str):
    try:
        response = requests.post(callback_url, json=payload, timeout=10)
        response.raise_for_status()
        logging.info(f"Successfully called back {callback_url} for topic '{payload['topic']}'.")
        print(f"✅ Successfully called back {callback_url} for topic '{payload['topic']}'.")
    except requests.RequestException as e:
        logging.error(f"Failed to call back {callback_url}: {e}")
        print(f"⚠️ Failed to call back {callback_url}: {e}")

@app.post("/search", response_model=SearchResponse)
async def search_tweets(topic: str = Query(..., description="The topic to search for tweets.")):
    SEARCH_QUERY = topic  
    THREAD_EMOJI = '🧵'     

    logging.info(f"Received search request for topic: {topic}")
    print(f"🔍 Searching for tweets with topic: {topic}")

    try:
        tweets = await client.search_tweet(SEARCH_QUERY, 'Top')
        logging.info(f"🔍 Found {len(tweets)} potential tweets for topic: {topic}")
        print(f"🔍 Found {len(tweets)} potential tweets for topic: {topic}")
    except Exception as e:
        logging.error(f"Error during tweet search for topic '{topic}': {e}")
        raise HTTPException(status_code=500, detail=f"Error during tweet search: {e}")

    thread_starts = [tweet for tweet in tweets if THREAD_EMOJI in tweet.text]
    
    response_threads = []
    response_top_tweets = []

    if not thread_starts:
        logging.info(f"No threads found for topic '{topic}'.")
        print(f"❌ No threads found for topic '{topic}'.")
        top_tweets = tweets[:3]
        for idx, tweet in enumerate(top_tweets, 1):
            try:
                tweet_node = TweetNode(text=tweet.text, id=str(tweet.id), child=None)
                response_top_tweets.append(ThreadModel(
                    thread_id=idx, 
                    tweets=tweet_node
                ))
                logging.info(f"Top Tweet #{idx} - ID: {tweet.id}, Content: {tweet.text[:50]}...")
            except Exception as e:
                logging.error(f"Error creating top tweet model: {e}")
                print(f"⚠️ Error creating top tweet model: {e}")
        return SearchResponse(topic=topic, threads=[], top_tweets=response_top_tweets)

    logging.info(f"📌 Found {len(thread_starts)} tweets with thread emoji for topic '{topic}'.")
    print(f"📌 Found {len(thread_starts)} tweets with thread emoji for topic '{topic}'.")

    tasks = []
    for tweet in thread_starts:
        try:
            tasks.append(tweet_processor.process_thread(str(tweet.id), tweet.text))
            logging.debug(f"Added processing task for Tweet ID {tweet.id}")
        except Exception as e:
            logging.error(f"Error creating task for Tweet ID {tweet.id}: {e}")

    threads = await asyncio.gather(*tasks)

    for idx, thread in enumerate(filter(None, threads), 1):
        try:
            validated_thread = TweetNode(**thread)
            response_threads.append(ThreadModel(
                thread_id=idx,
                tweets=validated_thread
            ))
            logging.info(f"Successfully processed thread {idx}")
        except ValidationError as e:
            logging.error(f"Validation error for thread {idx}: {e}")
            print(f"⚠️ Validation error for thread {idx}: {e}")
        except Exception as e:
            logging.error(f"Error processing thread {idx}: {e}")
            print(f"⚠️ Error processing thread {idx}: {e}")

    logging.info(f"📚 Collected {len(response_threads)} valid threads for topic '{topic}'.")
    print(f"📚 Collected {len(response_threads)} valid threads for topic '{topic}'.")

    return SearchResponse(topic=topic, threads=response_threads, top_tweets=None)

@app.post("/queue-keywords", response_model=dict)
def queue_keywords(
    topic: str = Body(..., embed=True),  
    background_tasks: BackgroundTasks = None
):
    background_tasks.add_task(process_keywords, topic, node_server_url)
    logging.info(f"Queued keyword generation for topic '{topic}'.")
    print(f"🔄 Queued keyword generation for topic '{topic}'.")
    return {"message": f"Keywords generation scheduled for topic '{topic}'."}