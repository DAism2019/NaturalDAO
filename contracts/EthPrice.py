#本合约用来获得ETH对USD的价格,小数点后数度为五位

#定义外部合约接口
contract FiatContract:
    def USD(_id: uint256) -> uint256: constant


#定义状态变量
fiator:public(FiatContract)
owner:public(address)

@public
def __init__():
    self.owner = msg.sender

@public
def setFiator(_faitor:address):
    assert msg.sender == self.owner
    self.fiator = FiatContract(_faitor)


@public
@constant
def getEthPrice() -> uint256:
    assert self.fiator != ZERO_ADDRESS
    return self.fiator.USD(0)
