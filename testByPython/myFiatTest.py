from web3.auto import w3
from json import loads
from os.path import dirname, abspath


network = 'https://api.infura.io/v1/jsonrpc/kovan'
# private_key = '0xeaa91cbb604771448ed1a871223a63fee42a63b881fff3797dc6ea46f76dd638'


def test():
    # my_provider = Web3.HTTPProvider(network)
    # w3 = Web3(my_provider)
    path = dirname(dirname(abspath(__file__))) + '/abi/MyFiat.json'
    contract_abi = loads(open(path).read())
    path = dirname(dirname(abspath(__file__))) + '/address/address.json'
    allAddress = loads(open(path).read())
    contract_address = allAddress['MyFiat.py']
    myContract = w3.eth.contract(address=contract_address, abi=contract_abi)
    # nonce = w3.eth.getTransactionCount('0x360466A41FF6617959c6b28516035a0581933F0C')
    # unicorn_txn = myContract.functions.setPrice(5).buildTransaction({
    #     "nonce": 81
    # })
    # private_key = "0xeaa91cbb604771448ed1a871223a63fee42a63b881fff3797dc6ea46f76dd638"
    # signed_txn = w3.eth.account.signTransaction(
    #     unicorn_txn, private_key=private_key)
    # w3.eth.sendRawTransaction(signed_txn.rawTransaction)

    price = myContract.functions.USD(0).call()
    print("price",price)
    price = 10 ** 18 / price / 100
    print("当前ETH价格:", format(price,'0.2f'),"$")


test()
