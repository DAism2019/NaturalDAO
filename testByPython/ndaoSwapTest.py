from web3.auto import w3
from json import loads
from os.path import dirname, abspath
import time
import math


exchange_address = ''
my_address = '0xDD55634e1027d706a235374e01D69c2D121E1CCb'
private_key = 'C86F5FFF8F4DF47012F78D5C0766366847735B9E08E614277CD8BA0A92CE33AC'


def buy():
    path = dirname(dirname(abspath(__file__))) + '/abi/Exchange.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=exchange_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    deadline = math.floor(time.time()) + 10 * 60
    unicorn_txn = myContract.functions.ndaoToTokenSwapInput(10**9, 100, deadline,).buildTransaction({
        'nonce': nonce,
        'gas': 400000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("稳定币购买代币交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


buy()
