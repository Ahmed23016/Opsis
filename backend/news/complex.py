import requests
from bs4 import BeautifulSoup
import json
from .commons import *


def get_articles(topic):
    url = f"https://www.complex.com/search?q={topic}&sortBy=trending"
    html = requests.get(url).text

    start_marker = 'window[Symbol.for("InstantSearchInitialResults")] = '
    start_idx = html.find(start_marker)
    if start_idx == -1:
        print("Could not locate the JSON assignment.")
        exit()

    json_start = html.find("{", start_idx)
    if json_start == -1:
        print("Could not find opening curly brace.")
        exit()

    open_brackets = 0
    json_end = None
    for i in range(json_start, len(html)):
        if html[i] == "{":
            open_brackets += 1
        elif html[i] == "}":
            open_brackets -= 1
            if open_brackets == 0:
                json_end = i
                break

    if json_end is None:
        print("Could not find matching closing brace.")
        exit()

    json_str = html[json_start : json_end + 1]

    data = json.loads(json_str)
    hits = data["prd_content"]["results"][0]["hits"]
    if hits:
        return scrape_article(hits[0]["canonicalURL"])
    return False
def scrape_article(url):
    re=requests.get(url)
    soup=BeautifulSoup(re.text,"html.parser")

    def get_container(soup):
        target_classes = {"sc-9fb0b2ca-12", "gwKiPo"}

        return  soup.find("div",class_=lambda c: c and target_classes == set(c.split()))
    content_div=get_container(soup)
    if not content_div:
            print("Could not find the main article container.")
    return content_div.text
