from web3.auto import w3
from json import loads
from os.path import dirname, abspath


#https://kovan.infura.io/Ug2W9nZzjwN4lITvvLT0


def test():
    path = dirname(dirname(abspath(__file__))) + '/abi/EthPrice.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['EthPrice.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    fiator = myContract.functions.fiator().call()
    price = myContract.functions.getEthPrice().call()
    price = 10 ** 18 / price /100
    print("具体查询合约地址:", fiator)
    print("当前ETH价格:", format(price,'0.2f'),"$")


test()
