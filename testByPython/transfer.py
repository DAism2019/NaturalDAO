# 向ICO发送ETH来deposit
# 因为本地Ganache建立的测试链直接使用MetaMask发送ETH会出错，所以使用脚本，也省去每次设定gas数量
# 需要知道ICO地址,结束ICO时仍使用此脚本
from web3.auto import w3
from json import loads
from os.path import dirname, abspath
from privateKey import my_address, private_key


icoAddress = '0xF315691d1E44888BD8134FBCcDa1D4DC0c220882'


def deposit():
    path = dirname(dirname(abspath(__file__))) + '/abi/Ico.json'
    contract_abi = loads(open(path).read())
    contract_address = icoAddress
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    nonce = w3.eth.getTransactionCount(my_address)
    unicorn_txn = myContract.functions.deposit().buildTransaction({
        'nonce': nonce,
        'value': w3.toWei(1000, 'ether'),
        'gasPrice': w3.toWei(10, 'gwei'),
        'gas': 500000
    })
    signed_txn = w3.eth.account.signTransaction(
        unicorn_txn, private_key=private_key)
    hash = w3.eth.sendRawTransaction(signed_txn.rawTransaction)
    print("投资交易已经发送，请耐心等待并查询,hash值为:", w3.toHex(hash))


def transfer():
    nonce = w3.eth.getTransactionCount(my_address)
    transaction = {
        'to': icoAddress,
        'value': w3.toWei(0.1, 'ether'),
        'gas': 500000,
        'gasPrice': w3.toWei(10, 'gwei'),
        'nonce': nonce
    }
    signed = w3.eth.account.signTransaction(transaction, private_key)
    w3.eth.sendRawTransaction(signed.rawTransaction)
    print("直接发送代币发送完毕")


try:
    deposit()
except ValueError:
    print("交易出错")
