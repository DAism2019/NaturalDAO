from web3.auto import w3
from json import loads
import time
from os.path import dirname, abspath
from privateKey import my_address, private_key

def transfer():
    _icoAddress = '0x5894c675477744B59Cd79e50d301486d75209BA7'
    exchange_address = '0xb6145A721ffd64029E72796b212d13065505d31c'
    path = dirname(dirname(abspath(__file__))) + '/abi/Ico.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=_icoAddress, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = myContract.functions.transfer(exchange_address,10000 * 10**18).buildTransaction({
        'nonce': nonce,
        'gas': 500000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("代币交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


transfer()
