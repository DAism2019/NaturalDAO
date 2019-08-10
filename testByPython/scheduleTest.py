import schedule
import time
import requests

header = {
    'user-agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
}
url = "https://api.pro.coinbase.com/products/ETH-USD/ticker"


def job():
    print("Query price of eth......")
    r = requests.get(url,headers=header)
    print(r.json())


schedule.every().minute.do(job)


job()
while True:
    schedule.run_pending()
    time.sleep(1)
