# 这个需要具体的交易对地址，不是模板地址
from web3.auto import w3
from json import loads
from os.path import dirname, abspath

myAddress = '0x18DaA5EC886325cD011F4278e39C18BE75C0E314'


def convertStatus(status):
    result = '不存在'
    if status == 1:
        result = '募集中'
    elif status == 2:
        result = '成功'
    elif status == 3:
        result = '失败'
    return result


def getExchangeAddress(_user):
    path = dirname(dirname(abspath(__file__))) + '/abi/Factory.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['Factory.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    lastIco = myContract.functions.getLatestIco().call({'from': _user})
    status = myContract.functions.allIcoStatus(lastIco).call()
    exchange = myContract.functions.getExchange(lastIco).call()
    print("当前交易对状态:", convertStatus(status))
    print('ico的地址为:', lastIco)
    print('交易对地址为:', exchange)
    return exchange


def getErc20(_address):
    path = dirname(dirname(abspath(__file__))) + '/abi/ERC20.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=_address, abi=contract_abi)
    return myContract


def test(_exchange):
    path = dirname(dirname(abspath(__file__))) + '/abi/Exchange.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=_exchange, abi=contract_abi)
    address = myContract.functions.tokenAddress().call()
    facAddress = myContract.functions.factoryAddress().call()
    ndaoAddress = myContract.functions.ndaoAddress().call()
    maxPool = myContract.functions.getMaxPool().call()
    tokenContract = getErc20(address)
    tokenBalance = tokenContract.functions.balanceOf(_exchange).call()
    token_des = tokenContract.functions.decimals().call()
    ndaoContract = getErc20(ndaoAddress)
    ndaoBalance = ndaoContract.functions.balanceOf(_exchange).call()
    ndao_des = ndaoContract.functions.decimals().call()
    print("代币地址:", address)
    print("控制合约地址:", facAddress)
    print("稳定币地址:", ndaoAddress)
    print("交易对代币上限:", maxPool)
    print("当前交易对代币数量:", tokenBalance / 10 ** token_des)
    print("当前交易对稳定币数量:", ndaoBalance / 10 ** ndao_des)


exchange = getExchangeAddress(myAddress)
# test(exchange)
