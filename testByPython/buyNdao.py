from web3.auto import w3
from json import loads
from os.path import dirname, abspath
from privateKey import my_address, private_key


def buy():
    path = dirname(dirname(abspath(__file__))) + '/abi/Factory.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['Factory.py']
    factoryContract = w3.eth.contract(
        address=contract_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = factoryContract.functions.buyNdao().buildTransaction({
        'nonce': nonce,
        'value': w3.toWei(1, 'ether'),
        'gasPrice': w3.toWei(10, 'gwei'),
        'gas': 500000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("购买交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


buy()
