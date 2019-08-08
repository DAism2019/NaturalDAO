from web3.auto import w3
from json import loads
from os.path import dirname, abspath
import time
import math
from privateKey import my_address,private_key



token_address = '0x8fFa5D48d5C4598E108f7cEcbF5eC28f991FceF0'
exchange_address = '0x83EE87c87c94bb29356Bc99eC1F702884cEe37Ef'
# transfer_address = '0x93C89E9a0e105056f6F89c1dc7fb5F1e42e9660d'
isTransfer = False


def buy():
    path = dirname(dirname(abspath(__file__))) + '/abi/Exchange.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=exchange_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    deadline = math.floor(time.time()) + 10 * 60
    if isTransfer:
        unicorn_txn = myContract.functions.ethToTokenTransferOutput( 100 * 10**18, deadline,transfer_address).buildTransaction({
            'nonce': nonce,
            'value': w3.toWei(1, 'ether'),
            'gas': 400000
        })
    else:
        unicorn_txn = myContract.functions.ethToTokenSwapOutput( 100 * 10**18, deadline).buildTransaction({
            'nonce': nonce,
            'value': w3.toWei(1, 'ether'),
            'gas': 400000
        })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("稳定币购买代币交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


buy()
