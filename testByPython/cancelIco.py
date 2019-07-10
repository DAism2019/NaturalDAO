from web3.auto import w3
from json import loads
from os.path import dirname, abspath
from privateKey import my_address, private_key


icoAddress = '0xF315691d1E44888BD8134FBCcDa1D4DC0c220882'


def cancel():
    path = dirname(dirname(abspath(__file__))) + '/abi/Ico.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=icoAddress, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = myContract.functions.cancelICO().buildTransaction({
        'nonce': nonce,
        'gas': 400000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("取消ICO交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


cancel()