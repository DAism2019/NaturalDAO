from web3.auto import w3
from json import loads
from os.path import dirname, abspath
import time
import math


exchange_address = ''
my_address = '0xDD55634e1027d706a235374e01D69c2D121E1CCb'
private_key = 'c86f5fff8f4df47012f78d5c0766366847735b9e08e614277cd8ba0a92ce33ac'


def buy():
    path = dirname(dirname(abspath(__file__))) + '/abi/Exchange.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=exchange_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    deadline = math.floor(time.time()) + 10 * 60
    unicorn_txn = myContract.functions.tokenToNdaoSwapInput(10**4, 10 ** 6, deadline,).buildTransaction({
        'nonce': nonce,
        'gas': 400000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("代币购买稳定币交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


buy()