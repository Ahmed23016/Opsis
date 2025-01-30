# twitter.py

import asyncio
import os
import json
import logging
from typing import List

from twikit import Client
from httpx import Timeout
from dotenv import load_dotenv



logging.basicConfig(
    filename='twitter_bot.log', 
    filemode='a',                 
    format='%(asctime)s - %(levelname)s - %(message)s', 
    level=logging.INFO          
)



load_dotenv()

USERNAME = os.getenv("TWITTER_USERNAME")
EMAIL = os.getenv("TWITTER_EMAIL")
PASSWORD = os.getenv("TWITTER_PASSWORD")
COOKIES_FILE = "cookies.json"  
MAX_LOGIN_RETRIES = 3        



client = Client('en-US')
client.http = client.http.__class__(
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Content-Type': 'application/json',
        'Origin': 'https://x.com',
        'Referer': 'https://x.com/',
        'DNT': '1'
    },
    timeout=Timeout(45.0)
)


class TweetProcessor:
    def __init__(self):
        self.threads = []  
        self.processed_ids = set()
        self.lock = asyncio.Lock()

    async def get_replies(self, tweet_id: int) -> List:
    
        try:
            tweet = await client.get_tweet_by_id(tweet_id)
            return tweet.replies
        except Exception as e:
            logging.error(f"Error fetching replies for {tweet_id}: {e}")
            return []

    async def process_thread(self, tweet_id: int, original_text: str):
    
        if tweet_id in self.processed_ids:
            return
        self.processed_ids.add(tweet_id)

        try:
            async with self.lock:
                if not self.threads or original_text not in self.threads[-1]:
                    self.threads.append([original_text])

            replies = await self.get_replies(tweet_id)
            parent_tweet = await client.get_tweet_by_id(tweet_id)
            
            tasks = []
            for reply in replies[:15]:
                if reply.user.id == parent_tweet.user.id:
                    async with self.lock:
                        if reply.text not in self.threads[-1]:
                            self.threads[-1].append(reply.text)
                    tasks.append(self.process_thread(reply.id, reply.text))
            
            if tasks:
                await asyncio.gather(*tasks)
            
        except Exception as e:
            logging.error(f"Error processing {tweet_id}: {e}")



async def load_cookies(file_path: str) -> bool:

    if not os.path.exists(file_path):
        logging.info(f"No cookies file found at {file_path}.")
        return False
    try:
        with open(file_path, 'r') as f:
            cookies = json.load(f)
            client.set_cookies(cookies)
        user = await client.user()
        logging.info(f"Loaded cookies successfully. Logged in as {user.name} (@{user.screen_name}).")
        print(f"✅ Logged in as {user.name} (@{user.screen_name})")
        return True
    except Exception as e:
        logging.warning(f"Failed to load or validate cookies from {file_path}: {e}")
        print(f"Failed to load cookies: {e}")
        return False

async def save_cookies(file_path: str):
  
    try:
        cookies = client.get_cookies()
        with open(file_path, 'w') as f:
            json.dump(cookies, f)
        logging.info(f"Cookies saved successfully to {file_path}.")
    except Exception as e:
        logging.error(f"Failed to save cookies to {file_path}: {e}")

async def perform_login_with_retries(username: str, email: str, password: str, max_retries: int = MAX_LOGIN_RETRIES) -> bool:
 
    for attempt in range(1, max_retries + 1):
        try:
            logging.info(f"Login attempt {attempt}...")
            print(f"🔑 Logging in to Twitter (Attempt {attempt})...")
            await client.login(
                auth_info_1=username,
                auth_info_2=email,
                password=password
            )
            await save_cookies(COOKIES_FILE)
            logging.info("Login successful and cookies saved.")
            print("✅ Login successful and cookies saved.")
            return True
        except Exception as e:
            logging.error(f"Login attempt {attempt} failed: {e}")
            print(f"⚠️ Login attempt {attempt} failed: {e}")
            if attempt < max_retries:
                wait_time = 2 ** attempt 
                print(f"⏳ Retrying in {wait_time} seconds...")
                await asyncio.sleep(wait_time)
            else:
                print("🔥 All login attempts failed. Exiting.")
    return False
