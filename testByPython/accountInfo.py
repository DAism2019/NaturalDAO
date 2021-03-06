#查询某一个交易对账户授权信息,需要知道交易对地址和token地址
from web3.auto import w3
from json import loads
from os.path import dirname, abspath
from privateKey import my_address,private_key

token_address = '0xF315691d1E44888BD8134FBCcDa1D4DC0c220882'
exchange_address = '0x0AF941876A9DA04876a15B6e770939368D6434a5'
token_address2 = '0x45BFeD742EE06d3AF0558f52dC8d451716D88029'
exchange2_address = '0xE1aBf577f28E7C935Deddba1292B22D10Eb3D232'

def approveInfo():
    path = dirname(dirname(abspath(__file__))) + '/abi/NDAOToken.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['NDAOToken.py']
    ndaoContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    path = dirname(dirname(abspath(__file__))) + '/abi/Ico.json'
    contract_abi = loads(open(path).read())
    tokenContract = w3.eth.contract(address=token_address, abi=contract_abi)
    tokenContract2 = w3.eth.contract(address=token_address2, abi=contract_abi)
    ndaoApprove = ndaoContract.functions.allowance(my_address,exchange_address).call()
    ndaoBalance = ndaoContract.functions.balanceOf(my_address).call()
    tokenApprove = tokenContract.functions.allowance(my_address,exchange_address).call()
    tokenBalance = tokenContract.functions.balanceOf(my_address).call()
    tokenApprove2 = tokenContract2.functions.allowance(my_address,exchange2_address).call()
    tokenBalance2 = tokenContract2.functions.balanceOf(my_address).call()
    print("我的地址为:",my_address)
    print("稳定币授权余额为:",ndaoApprove)
    print("代币授权余额为:",tokenApprove)
    print("代币2授权余额为:",tokenApprove2)
    print("稳定币余额为:",ndaoBalance/10 ** 8)
    print("代币余额为:",tokenBalance/10 ** 3)
    print("代币2余额为:",tokenBalance2/10 ** 3)


approveInfo()
