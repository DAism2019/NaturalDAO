from web3.auto import w3
from json import loads
from os.path import dirname, abspath


def test():
    path = dirname(dirname(abspath(__file__))) + '/abi/MyFiat.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['MyFiat.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    price = myContract.functions.USD(0).call()
    price = 10 ** 18 / price / 100
    print("当前ETH价格:", format(price, '0.2f'), "$")


test()
