import requests
from bs4 import BeautifulSoup
import json


def get_articles(topic):
    url = f"https://economictimes.indiatimes.com/topic/{topic}"

    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    script = soup.find('script', type='application/ld+json', string=lambda t: 'ItemList' in t)

    if script:
        try:
            data = json.loads(script.string)
            items = data.get('itemListElement', [])[:1]  
            
            results = []
            for item in items:
                results.append({
                    'title': item.get('name'),
                    'url': item.get('url')
                })
                
            articles=[]
            for i in results:
                articles.append(scrape_article(i['url']))
            return articles[0]
            
        except json.JSONDecodeError:
            print("Error parsing JSON data")
    else:
        print("ItemList schema not found")

def scrape_article(url):

    re=requests.get(url)
    soup = BeautifulSoup(re.content, 'html.parser')

    script = soup.find('script', type='application/ld+json', string=lambda t: 'NewsArticle' in t)

    if script:
        try:
            data = json.loads(script.string)
            article_body = data.get('articleBody', '')

            return article_body
            print("-----\n")
        except json.JSONDecodeError:
            print("Error parsing JSON-LD data")
            return None
    else:
        print("NewsArticle schema not found")
