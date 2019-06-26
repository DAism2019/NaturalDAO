from web3.auto import w3
from json import loads
from os.path import dirname, abspath


network = 'https://api.infura.io/v1/jsonrpc/kovan'


def test():
    # my_provider = Web3.HTTPProvider(network)
    # w3 = Web3(my_provider)
    path = dirname(dirname(abspath(__file__))) + '/abi/NDaoToken.json'
    contract_abi = loads(open(path).read())
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['NDAOToken.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    decimals = myContract.functions.decimals().call()
    name = myContract.functions.name().call()
    symbol = myContract.functions.symbol().call()
    totalSupply = myContract.functions.totalSupply().call()
    minter = myContract.functions.minter().call()
    print("代币名称:", name)
    print("代币符号:", symbol)
    print("代币精度:", decimals)
    print("发行总量:", totalSupply/10 ** decimals)
    print("增发合约地址:",minter)


test()
