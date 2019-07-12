# 这个用来测试交易对的恒定乘积变化速率
from web3.auto import w3
from json import loads
from os.path import dirname, abspath
from privateKey import my_address, private_key
from threading import Timer
import math
import time


token_address = '0xF315691d1E44888BD8134FBCcDa1D4DC0c220882'
exchange_address = '0x0AF941876A9DA04876a15B6e770939368D6434a5'
mul = 0
counter = 0


def initContract():
    global myContract, tokenContract, ndaoContract
    path = dirname(dirname(abspath(__file__))) + '/abi/Exchange.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=exchange_address, abi=contract_abi)
    token_path = dirname(dirname(abspath(__file__))) + '/abi/ERC20.json'
    token_abi = loads(open(token_path).read())
    tokenContract = w3.eth.contract(address=token_address, abi=token_abi)
    address_path = dirname(dirname(abspath(__file__))) + \
        '/address/address.json'
    allAddress = loads(open(address_path).read())
    ndao_address = allAddress['NDAOToken.py']
    ndaoContract = w3.eth.contract(address=ndao_address, abi=token_abi)
    print("所有合约初始化完毕")


def getBalance():
    global mul, counter
    if counter % 10 == 0:
        tokenBalance = tokenContract.functions.balanceOf(
            exchange_address).call()
        ndaoBalance = ndaoContract.functions.balanceOf(exchange_address).call()
    if counter == 0:
        mul = tokenBalance * ndaoBalance
        print("交易对初始乘积为:", mul)
    elif counter % 10 == 0:
        _mul = tokenBalance * ndaoBalance
        rate = 100 * (_mul - mul) / mul
        print("第", counter, "次交易后交易对乘积数量为:", _mul,"增加比率为:", rate, "%。")


def transacte():
    getBalance()
    global counter, timer
    counter += 1
    nonce = w3.eth.getTransactionCount(my_address)
    deadline = math.floor(time.time()) + 10 * 60
    ndao_des = 8
    token_des = 8
    if False:
    # if counter % 2 == 0:
        unicorn_txn = myContract.functions.tokenToNdaoSwapInput(13 * 10**token_des, 1, deadline).buildTransaction({
            'nonce': nonce,
            'gas': 400000
        })
    else:
        unicorn_txn = myContract.functions.tokenToNdaoSwapOutput(1 * 10**ndao_des, 10 ** 20, deadline).buildTransaction({
            'nonce': nonce,
            'gas': 400000
        })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    if counter <= 200:
        timer = Timer(2, transacte)
        timer.start()
    else:
        timer.cancel()


def start():
    timer = Timer(2, transacte)
    timer.start()


initContract()
start()
