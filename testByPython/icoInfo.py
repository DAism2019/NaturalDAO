# 每个ICO要单独设置地址
from web3.auto import w3
from json import loads
import time
from os.path import dirname, abspath


my_address = '0xDD55634e1027d706a235374e01D69c2D121E1CCb'
private_key = 'C86F5FFF8F4DF47012F78D5C0766366847735B9E08E614277CD8BA0A92CE33AC'
ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'


def convertStatus(status):
    result = '不存在'
    if status == 1:
        result = '募集中'
    elif status == 2:
        result = '成功'
    elif status == 3:
        result = '失败'
    return result


def getIcoAddress(_user):
    path = dirname(dirname(abspath(__file__))) + '/abi/Factory.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['Factory.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    lastIco = myContract.functions.getLatestIco().call({'from': _user})
    creater = myContract.functions.allIcoCreater(lastIco).call()
    status = myContract.functions.allIcoStatus(lastIco).call()
    exchange = myContract.functions.getExchange(lastIco).call()
    print("ICO详情:")
    print("-----------------------------------------------------")
    print('ICO地址为:', lastIco)
    print('ICO申请者地址为:', creater)
    print("当前ICO状态:", convertStatus(status))
    if exchange != ZERO_ADDRESS:
        print("ICO对应的交易对地址为:", exchange)
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
    myDeposit = myContract.functions.depositBalanceOfUser(
        my_address).call()
    print("代币名称:", name)
    print("代币符号:", symbol)
    print("代币精度:", decimals)
    print("发行总量:", totalSupply / 10 ** decimals)
    print("募集目标:", depositGoal / 10 ** 18, "ETH")
    print("发行价格: 1EHT =", price / 10 ** decimals, symbol)
    print("开始时间:", depositStart)
    print("结束时间:", depositEnd)
    print("当前募集金额:", depositAmount / 10 ** 18, "ETH")
    print("我的投资总额度:", myDeposit / 10 ** 18, "ETH")
    print("是否结束:", isEnd)
    print("目标是否达成:", isReached)
    print("创建合约地址:", factoryAddress)


ico = getIcoAddress(my_address)
if ico != ZERO_ADDRESS:
    test(ico)
