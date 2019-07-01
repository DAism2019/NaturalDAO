from web3.auto import w3
from json import loads
from os.path import dirname, abspath
from privateKey import my_address,private_key

icoAddress = '0xF315691d1E44888BD8134FBCcDa1D4DC0c220882'


def transfer():
    nonce = w3.eth.getTransactionCount(my_address)
    transaction = {
        'to': icoAddress,
        'value': w3.toWei(0.1, 'ether'),
        'gas': 500000,
        'gasPrice':w3.toWei(10, 'gwei'),
        'nonce': nonce
    }
    signed = w3.eth.account.signTransaction(transaction, private_key)
    w3.eth.sendRawTransaction(signed.rawTransaction)
    print("交易发送完毕")


transfer()
