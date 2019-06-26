from web3.auto import w3
from json import loads
from os.path import dirname, abspath


private_key = 'ee073db770c1651355da09b83b241a65183eccca5ff4497aa35100c8080d9582'
myAddress = '0x18DaA5EC886325cD011F4278e39C18BE75C0E314'


def createIco():
    path = dirname(dirname(abspath(__file__))) + '/abi/Factory.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['Factory.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(myAddress)
    goal = w3.toWei(0.1, 'ether')
    unicorn_txn = myContract.functions.createICO('KHCoins', 'KHC', 3, goal, 120, 1000000).buildTransaction({
        'nonce': nonce,
        'gas': 400000

    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("创建交易已经发送，请耐心等待并查询,hash值为:",w3.toHex(hash))


createIco()
