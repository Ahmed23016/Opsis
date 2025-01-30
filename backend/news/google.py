import requests
from bs4 import BeautifulSoup

def get_url(topic):
    base_url = "https://news.google.com"
    query = topic.replace(" ", "+")
    return f"{base_url}/search?q={query}&hl=en-US&gl=US&ceid=US%3Aen"
def get_cols(soup):
    return soup.find_all("div",class_="B6pJDd")
def get_news_title(soup):
    return soup.find("a",class_="JtKRv")
def get_authors(soup):
    return soup.find("div",class_="vr1PYe")
def main(topic):
    url = get_url(topic)
    print("Searching URL:", url)

    response = requests.get(url)
    print("Status code:", response.status_code)

    soup = BeautifulSoup(response.text, "html.parser")

    titles=[]
    cols=get_cols(soup)
    for i in cols:
        titles.append({"Title":get_news_title(i).text,"Author":get_authors(i).text})
    return titles[:1]


