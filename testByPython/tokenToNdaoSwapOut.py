# token to ndao swap input test
# 需要知道交易对地址
from web3.auto import w3
from json import loads
from os.path import dirname, abspath
from privateKey import my_address, private_key
import time
import math


token_address = '0xF315691d1E44888BD8134FBCcDa1D4DC0c220882'
exchange_address = '0x0AF941876A9DA04876a15B6e770939368D6434a5'
transfer_address = '0x93C89E9a0e105056f6F89c1dc7fb5F1e42e9660d'
isTransfer = True


def buy():
    path = dirname(dirname(abspath(__file__))) + '/abi/Exchange.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=exchange_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    deadline = math.floor(time.time()) + 10 * 60
    if isTransfer:
        unicorn_txn = myContract.functions.tokenToNdaoTransferOutput(5* 10**8, 10 ** 8, deadline, transfer_address).buildTransaction({
            'nonce': nonce,
            'gas': 400000
        })
    else:
        unicorn_txn = myContract.functions.tokenToNdaoSwapOutput(5**9, 10 ** 8, deadline).buildTransaction({
            'nonce': nonce,
            'gas': 400000
        })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


buy()
