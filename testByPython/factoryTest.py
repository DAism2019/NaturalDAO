from web3.auto import w3
from json import loads
from os.path import dirname, abspath


network = 'https://api.infura.io/v1/jsonrpc/kovan'


def test():
    # my_provider = Web3.HTTPProvider(network)
    # w3 = Web3(my_provider)
    path = dirname(dirname(abspath(__file__))) + '/abi/Factory.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['Factory.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    exchangeTemplate = myContract.functions.exchangeTemplate().call()
    icoTemplate = myContract.functions.icoTemplate().call()
    tokenCount = myContract.functions.tokenCount().call()
    beneficiary = myContract.functions.beneficiary().call()
    ndaoAddress = myContract.functions.ndaoAddress().call()
    queryAddress = myContract.functions.queryAddress().call()
    print("交易对模板地址:", exchangeTemplate)
    print("ICO模板地址:", icoTemplate)
    print("ETH仓库地址:",beneficiary)
    print("稳定币地址:",ndaoAddress)
    print("ETH价格查询合约地址:",queryAddress)


test()
