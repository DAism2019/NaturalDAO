from web3.auto import w3
from json import loads
from os.path import dirname, abspath


my_address = '0xDD55634e1027d706a235374e01D69c2D121E1CCb'
private_key = 'C86F5FFF8F4DF47012F78D5C0766366847735B9E08E614277CD8BA0A92CE33AC'


def createIco():
    path = dirname(dirname(abspath(__file__))) + '/abi/Factory.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['Factory.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
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
