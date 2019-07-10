#查询某一个交易对账户授权信息,需要知道交易对地址和token地址
from web3.auto import w3
from json import loads
from os.path import dirname, abspath
# from privateKey import my_address,private_key

token_address = '0xF315691d1E44888BD8134FBCcDa1D4DC0c220882'
exchange_address = '0x0AF941876A9DA04876a15B6e770939368D6434a5'
my_address = '0x93C89E9a0e105056f6F89c1dc7fb5F1e42e9660d'
private_key = '1b1174bc3a713d8af27324fbfee6172a9b7c0394f8bca473583d8d3cbd39b4cf'


def info():
    path = dirname(dirname(abspath(__file__))) + '/abi/NDAOToken.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['NDAOToken.py']
    ndaoContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    path = dirname(dirname(abspath(__file__))) + '/abi/Ico.json'
    contract_abi = loads(open(path).read())
    tokenContract = w3.eth.contract(address=token_address, abi=contract_abi)
    # ndaoApprove = ndaoContract.functions.allowance(my_address,exchange_address).call()
    ndaoBalance = ndaoContract.functions.balanceOf(my_address).call()
    # tokenApprove = tokenContract.functions.allowance(my_address,exchange_address).call()
    tokenBalance = tokenContract.functions.balanceOf(my_address).call()
    print("我的地址为:",my_address)
    # print("稳定币授权余额为:",ndaoApprove)
    # print("代币授权余额为:",tokenApprove)
    print("稳定币余额为:",ndaoBalance)
    print("代币余额为:",tokenBalance)


info()
