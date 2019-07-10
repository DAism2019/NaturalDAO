#对某一个交易对账户进行ndao和token授权,需要知道交易对地址和token地址
from web3.auto import w3
from json import loads
from os.path import dirname, abspath
from privateKey import my_address,private_key


token_address = '0x45BFeD742EE06d3AF0558f52dC8d451716D88029'
exchange_address = '0xE1aBf577f28E7C935Deddba1292B22D10Eb3D232'

approve_amount = 10 ** 20



def approve():
    path = dirname(dirname(abspath(__file__))) + '/abi/NDAOToken.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['NDAOToken.py']
    ndaoContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    path = dirname(dirname(abspath(__file__))) + '/abi/Ico.json'
    contract_abi = loads(open(path).read())
    tokenContract = w3.eth.contract(address=token_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = ndaoContract.functions.approve(exchange_address, approve_amount).buildTransaction({
        'nonce': nonce,
        'gas': 200000

    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("稳定币授权交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))
    nonce = nonce + 1
    unicorn_txn = tokenContract.functions.approve(exchange_address, approve_amount).buildTransaction({
        'nonce': nonce,
        'gas': 200000

    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("ICO代币授权交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


approve()
