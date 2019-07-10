from web3.auto import w3
from json import loads
from os.path import dirname, abspath
from privateKey import my_address, private_key
import time
import math


token_address = '0xF315691d1E44888BD8134FBCcDa1D4DC0c220882'
exchange_address = '0x0AF941876A9DA04876a15B6e770939368D6434a5'
tokenOut = True


def getPrice():
    path = dirname(dirname(abspath(__file__))) + '/abi/Exchange.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=exchange_address, abi=contract_abi)
    if tokenOut:
        result = myContract.functions.getNdaoToTokenOutputPrice(5 * 10**3).call()
        result = result /10 ** 8
    else:
        result = myContract.functions.getTokenToNdaoOutputPrice(10**9).call()
        result = result / 10 ** 3

    print("结果为:",result)


getPrice()
