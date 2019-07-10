#token to toekn swap input test
#需要知道两个交易对的地址和token地址
from web3.auto import w3
from json import loads
from os.path import dirname, abspath
import math
import time
from privateKey import my_address,private_key


token1_address = '0xF315691d1E44888BD8134FBCcDa1D4DC0c220882'
exchange1_address = '0x0AF941876A9DA04876a15B6e770939368D6434a5'
token2_adddress = '0x45BFeD742EE06d3AF0558f52dC8d451716D88029'
exchange2_address = '0xE1aBf577f28E7C935Deddba1292B22D10Eb3D232'
transfer_address = '0x93C89E9a0e105056f6F89c1dc7fb5F1e42e9660d'
isTransfer = True


def test():
    path = dirname(dirname(abspath(__file__))) + '/abi/Exchange.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=exchange2_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    deadline = math.floor(time.time()) + 10 * 60
    if isTransfer:
        unicorn_txn = myContract.functions.tokenToExchangeTransferOutput(10 * 10**3, 10 ** 12, 10 ** 12, deadline,transfer_address,exchange1_address).buildTransaction({
            'nonce': nonce,
            'gas': 400000
        })
    else:
        unicorn_txn = myContract.functions.tokenToExchangeSwapOutput(10 * 10**3, 10 ** 12, 10 ** 12, deadline, exchange1_address).buildTransaction({
            'nonce': nonce,
            'gas': 400000
        })

    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("币币交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


test()
