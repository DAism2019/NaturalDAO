from web3.auto import w3
from json import loads
from os.path import dirname, abspath
import math
import time
from privateKey import my_address,private_key

# token1_address = '0xA43c2a8fC5a613F4156e911C363C19EdC78392d8'
exchange1_address = '0x48ae9d29b3bB7537ec072f5219240DE3510a4105'
token2_adddress = '0x82eB35Cb739f039f9b6973908969C66351Ac16C4'
# exchange2_address = '0xdFc8E8f0fcBb73D78D5C025B75BEB9EB3D963584'


def test():
    path = dirname(dirname(abspath(__file__))) + '/abi/Exchange.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=exchange1_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    deadline = math.floor(time.time()) + 10 * 60
    unicorn_txn = myContract.functions.tokenToTokenSwapInput(10**5, 1, 1, deadline, token2_adddress).buildTransaction({
        'nonce': nonce,
        'gas': 400000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("币币交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


test()
