# 创建ICO测试，这里为了方便测试，将持续时间设置为了120秒
# from web3.auto import w3
from web3 import Web3,HTTPProvider
from json import loads
from os.path import dirname, abspath
from privateKey import my_address, private_key

w3 = Web3(HTTPProvider('https://ropsten.infura.io/v3/9e1f16ff18f847bfb54093d4cf8c5f78'))


def createIco():
    path = dirname(dirname(abspath(__file__))) + '/abi/Factory.json'
    contract_abi = loads(open(path).read())
    # path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    # allAddress = loads(open(path).read())
    # contract_address = allAddress['Factory.py']
    contract_address = "0x2DC4C5aa9d6aCD58D8133560fbDAEa442E6e501D"
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    goal = w3.toWei(0.1, 'ether')
    des = 18
    timedelta = 3600 * 2
    # price : 1 eth => 1100000 tokens
    price = 10000 * 10 ** des
    unicorn_txn = myContract.functions.createICO('HHCoins', 'HHC', des, goal, timedelta, price).buildTransaction({
        'nonce': nonce,
        'gas': 500000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("创建交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


createIco()
