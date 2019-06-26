# 每个ICO要单独设置地址
from web3.auto import w3
from json import loads
import time
from os.path import dirname, abspath

myAddress = '0x18DaA5EC886325cD011F4278e39C18BE75C0E314'
# contract_address = '0xf249015Aeb625D459a3612770437439Ce7685E8E'
depositAddress = '0xDD55634e1027d706a235374e01D69c2D121E1CCb'


def getIcoAddress(_user):
    path = dirname(dirname(abspath(__file__))) + '/abi/Factory.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['Factory.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    lastIco = myContract.functions.getLatestIco().call({'from': _user})
    print('最新创建的ico地址为:', lastIco)
    return lastIco


def test(_icoAddress):
    path = dirname(dirname(abspath(__file__))) + '/abi/Ico.json'
    contract_abi = loads(open(path).read())
    myContract = w3.eth.contract(address=_icoAddress, abi=contract_abi)
    decimals = myContract.functions.decimals().call()
    name = myContract.functions.name().call()
    symbol = myContract.functions.symbol().call()
    totalSupply = myContract.functions.totalSupply().call()
    depositGoal = myContract.functions.depositGoal().call()
    depositStart = myContract.functions.depositStart().call()
    depositStart = time.strftime(
        "%Y-%m-%d %H:%M:%S", time.localtime(depositStart))
    depositEnd = myContract.functions.depositEnd().call()
    depositEnd = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(depositEnd))
    ended = myContract.functions.ended().call()
    isEnd = '否'
    if ended:
        isEnd = '是'
    goalReached = myContract.functions.goalReached().call()
    isReached = '否'
    if goalReached:
        isReached = '是'
    price = myContract.functions.price().call()
    depositAmount = myContract.functions.depositAmount().call()
    factoryAddress = myContract.functions.factory().call()
    myDeposit = myContract.functions.depositBalanceOfUser(depositAddress).call()
    print("ICO详情:")
    print("代币名称:", name)
    print("代币符号:", symbol)
    print("代币精度:", decimals)
    print("发行总量:", totalSupply / 10 ** decimals)
    print("募集目标:", depositGoal / 10 ** 18, "ETH")
    print("发行价格: 1EHT =", price / 10 ** decimals, symbol)
    print("开始时间:", depositStart)
    print("结束时间:", depositEnd)
    print("当前募集金额:", depositAmount / 10 ** 18, "ETH")
    print("我的投资总额度:",myDeposit)
    print("是否结束:", isEnd)
    print("目标是否达成:", isReached)
    print("创建合约地址:", factoryAddress)


ico = getIcoAddress(myAddress)
if ico != '0x0000000000000000000000000000000000000000':
    test(ico)
