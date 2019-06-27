from web3.auto import w3
from json import loads
from os.path import dirname, abspath


token_address = ''
exchange_address = ''
my_address = '0xDD55634e1027d706a235374e01D69c2D121E1CCb'
private_key = 'C86F5FFF8F4DF47012F78D5C0766366847735B9E08E614277CD8BA0A92CE33AC'
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
    ndaoApprove = ndaoContract.functions.allowance(my_address,exchange_address).call()
    ndaoBalance = ndaoContract.functions.balanceOf(my_address).call()
    tokenApprove = tokenContract.functions.allowance(my_address,exchange_address).call()
    tokenBalance = tokenContract.functions.balanceOf(my_address).call()
    print("我的地址为:",my_address)
    print("稳定币授权余额为:",ndaoApprove)
    print("代币授权余额为:",tokenApprove)
    print("稳定币余额为:",ndaoBalance)
    print("代币余额为:",tokenBalance)


approve()
