from web3.auto import w3
from json import loads
from os.path import dirname, abspath
import time
import math
from privateKey import my_address,private_key


test_address = '0x6EB34984Dad50Ff58b012875cD70a39b97008D43'


def buy():
    path = dirname(dirname(abspath(__file__))) + '/abi/buyNdaoTest.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=test_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    deadline = math.floor(time.time()) + 10 * 60
    unicorn_txn = myContract.functions.buyNdao( 50 * 10**18, deadline).buildTransaction({
        'nonce': nonce,
        'value': w3.toWei(1, 'ether'),
        'gas': 400000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("稳定币购买代币交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


buy()
