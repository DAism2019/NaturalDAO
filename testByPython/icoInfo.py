# 查询某个ICO详情，默认查询当前账号创建的最后一个ICO详情
from web3.auto import w3
from json import loads
import time
from os.path import dirname, abspath
from privateKey import my_address, private_key


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
    ended = myContract.functions.isEnd().call()
    _isFailed = myContract.functions.isFailed().call()
    _creater = myContract.functions.creater().call()
    isEnd = '否'
    if ended:
        isEnd = '是'
    goalReached = myContract.functions.goalReached().call()
    isReached = '否'
    if goalReached:
        isReached = '是'
    isFailed = '否'
    if _isFailed:
        isFailed = '是'
    tokenPrice = myContract.functions.tokenPrice().call()
    depositAmount = myContract.functions.depositAmount().call()
    finalSubmissionTime = myContract.functions.finalSubmissionTime().call()
    finalSubmissionTime = time.strftime(
        "%Y-%m-%d %H:%M:%S", time.localtime(finalSubmissionTime))
    myDeposit = myContract.functions.depositBalanceOfUser(my_address).call()
    icoBalance = w3.eth.getBalance(_icoAddress)
    print("代币名称:", name)
    print("代币符号:", symbol)
    print("代币精度:", decimals)
    print("已经发行代币数量:", totalSupply / 10 ** decimals)
    print("募集目标:", depositGoal / 10 ** 18, "ETH")
    print("发行价格: 1EHT =", tokenPrice / 10 ** decimals, symbol)
    print("开始时间:", depositStart)
    print("结束时间:", depositEnd)
    print("确认结束时间:", finalSubmissionTime)
    print("当前合约金额:", icoBalance / 10 ** 18, 'ETH')
    print("当前募集金额:", depositAmount / 10 ** 18, "ETH")
    print("我的投资总额度:", myDeposit / 10 ** 18, "ETH")
    print("是否结束:", isEnd)
    print("目标是否达成:", isReached)
    print("ICO是否失败:", isFailed)
    # print("创建合约地址:", factoryAddress)
    print("ICO申请者地址:", _creater)


ico = getIcoAddress(my_address)
if ico != ZERO_ADDRESS:
    test(ico)
