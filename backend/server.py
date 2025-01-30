# server.py

import asyncio
import os
import json
import logging
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Body
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests

from twitter import (
    client,
    TweetProcessor,
    load_cookies,
    save_cookies,
    perform_login_with_retries
)
from gen_kywrds import get_keywords



logging.basicConfig(
    filename='twitter_bot.log', 
    filemode='a',                
    format='%(asctime)s - %(levelname)s - %(message)s', 
    level=logging.INFO           
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



class ThreadModel(BaseModel):
    thread_id: int
    tweets: List[str]

class SearchResponse(BaseModel):
    topic: str
    threads: List[ThreadModel]
    top_tweets: Optional[List[ThreadModel]] = None  

class TopicRequest(BaseModel):
    topic: str



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

@app.on_event("shutdown")
async def shutdown_event():
    logging.info("Shutting down the Twitter Backend API...")
    print("🛑 Shutting down the Twitter Backend API...")


def process_and_callback(topic: str, callback_url: str):

    keywords = get_keywords(topic)  

    payload = {"topic": topic, "keywords": keywords}
    try:
        response = requests.post(callback_url, json=payload, timeout=10)
        response.raise_for_status()
        logging.info(f"Successfully called back {callback_url} for topic '{topic}'.")
        print(f"✅ Successfully called back {callback_url} for topic '{topic}'.")
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
            response_top_tweets.append(ThreadModel(thread_id=idx, tweets=[tweet.text]))
            logging.info(f"Top Tweet #{idx} - ID: {tweet.id}, User: {tweet.user.name}, Content: {tweet.text}")
        return SearchResponse(topic=topic, threads=[], top_tweets=response_top_tweets)

    logging.info(f"📌 Found {len(thread_starts)} tweets with thread emoji for topic '{topic}'.")
    print(f"📌 Found {len(thread_starts)} tweets with thread emoji for topic '{topic}'.")

    tasks = []
    for idx, tweet in enumerate(thread_starts, 1):
        logging.info(f"🧵 Found thread starter: {tweet.id}")
        print(f"🧵 Found thread starter: {tweet.id}")
        print(f"📝 Content: {tweet.text[:60]}...")
        logging.info(f"📝 Content: {tweet.text[:60]}...")
        self_thread = []
        tweet_processor.threads.append(self_thread)
        tasks.append(tweet_processor.process_thread(tweet.id, tweet.text))
    
    await asyncio.gather(*tasks)

    for idx, thread in enumerate(tweet_processor.threads[-len(thread_starts):], 1):
        response_threads.append(ThreadModel(thread_id=idx, tweets=thread))
    
    logging.info(f"📚 Collected {len(response_threads)} threads for topic '{topic}'.")
    print(f"📚 Collected {len(response_threads)} threads for topic '{topic}'.")

    return SearchResponse(topic=topic, threads=response_threads, top_tweets=None)

@app.post("/queue-keywords", response_model=dict)
def queue_keywords(
    topic: str = Body(..., embed=True),  
    background_tasks: BackgroundTasks = None
):

    background_tasks.add_task(process_and_callback, topic, node_server_url)
    logging.info(f"Queued keyword generation for topic '{topic}'.")
    print(f"🔄 Queued keyword generation for topic '{topic}'.")
    return {"message": f"Keywords generation scheduled for topic '{topic}'."}
