import asyncio
import os
import json
import logging
from typing import List, Optional, Dict
import time
from twikit import Client
from httpx import Timeout
from dotenv import load_dotenv

logging.basicConfig(
    filename='twitter_bot.log',
    filemode='a',
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
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
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0',
        'Content-Type': 'application/json',
        'Origin': 'https://x.com',
        'Referer': 'https://x.com/',
        'DNT': '1'
    },
    timeout=Timeout(45.0)
)

class TweetProcessor:
    def __init__(self, max_depth: int = 100):
        self.processed_ids = set()
        self.lock = asyncio.Lock()
        self.max_depth = max_depth

    async def get_replies(self, tweet_id: str) -> List:
        try:
            tweet = await client.get_tweet_by_id(tweet_id)
            logging.debug(f"Fetched {len(tweet.replies)} replies for Tweet ID {tweet_id}")
            return tweet.replies
        except Exception as e:
            logging.error(f"Error fetching replies for Tweet ID {tweet_id}: {e}")
            return []

    async def process_thread(self, tweet_id: str, original_text: str, current_depth: int = 0) -> Optional[Dict]:
        time.sleep(2)
        if current_depth > self.max_depth:
            print(current_depth,self.max_depth)
            
            logging.debug(f"Max depth reached for Tweet ID {tweet_id}")
            return None

        if tweet_id in self.processed_ids:
            logging.debug(f"Already processed Tweet ID {tweet_id}")
            return None
            
        self.processed_ids.add(tweet_id)
        try:
            parent_tweet = await client.get_tweet_by_id(tweet_id)
            thread = {
                "text": parent_tweet.text,
                "id": tweet_id,
                "child": None
            }

            logging.debug(f"Processing thread for Tweet ID {tweet_id}: {parent_tweet.text[:50]}...")

            replies = await self.get_replies(tweet_id)
            user_replies = [reply for reply in replies if reply.user.id == parent_tweet.user.id][:15]

            if user_replies:
                child_reply = user_replies[0]
                child_thread = await self.process_thread(str(child_reply.id), child_reply.text, current_depth + 1)
                thread["child"] = child_thread

            return thread

        except Exception as e:
            logging.error(f"Error processing Tweet ID {tweet_id}: {e}")
            return None

async def load_cookies(file_path: str) -> bool:
    if not os.path.exists(file_path):
        logging.info(f"No cookies file found at {file_path}")
        return False
    try:
        with open(file_path, 'r') as f:
            cookies = json.load(f)
            client.set_cookies(cookies)
        user = await client.user()
        logging.info(f"Logged in as {user.name} (@{user.screen_name})")
        print(f"✅ Logged in as {user.name} (@{user.screen_name})")
        return True
    except Exception as e:
        logging.warning(f"Cookie load error: {e}")
        print(f"⚠️ Cookie load error: {e}")
        return False

async def save_cookies(file_path: str):
    try:
        cookies = client.get_cookies()
        with open(file_path, 'w') as f:
            json.dump(cookies, f)
        logging.info(f"Saved cookies to {file_path}")
    except Exception as e:
        logging.error(f"Cookie save error: {e}")

async def perform_login_with_retries(username: str, email: str, password: str, max_retries: int = MAX_LOGIN_RETRIES) -> bool:
    for attempt in range(1, max_retries + 1):
        try:
            logging.info(f"Login attempt {attempt}")
            print(f"🔑 Login attempt {attempt}")
            await client.login(
                auth_info_1=username,
                auth_info_2=email,
                password=password
            )
            await save_cookies(COOKIES_FILE)
            logging.info("Login successful")
            print("✅ Login successful")
            return True
        except Exception as e:
            logging.error(f"Login failed: {e}")
            print(f"⚠️ Login failed: {e}")
            if attempt < max_retries:
                wait_time = 2 ** attempt
                print(f"⏳ Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
    print("🔥 All login attempts failed")
    return False