from bs4 import BeautifulSoup
import requests
from .commons import write_to_html,filter_topic
from playwright.async_api import async_playwright

base_url="https://www.nytimes.com"

async def get_articles(topic):
    re=requests.get(f"https://www.nytimes.com/search?dropmab=false&lang=en&query={topic}&sort=best")
    write_to_html(re.text)
    soup=BeautifulSoup(re.content,"html.parser")
    art=[]
    articles= soup.find_all("div","css-1i8vfl5")
    for i in articles:
        art.append({"Title":i.find("h4","css-nsjm9t").text,"URL":base_url+i.find("a").get("href")})
    content=await scrape_article(art[0]["URL"])
    return content

async def scrape_article(url):

    soup=None
    async with async_playwright() as p:
        browser =await p.chromium.launch(headless=True)  
        page = await browser.new_page()
        
        await page.goto(url)
        
        
        await page.wait_for_selector("div.css-53u6y8")

        soup=BeautifulSoup(await page.content(),"html.parser")
        await browser.close()
    div=soup.find("div",class_="css-53u6y8")
    return div.text