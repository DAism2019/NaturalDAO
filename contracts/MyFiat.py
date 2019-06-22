#在外部Fiat不可用时使用自己的合约替代

#定义一个价格变化事件
SetEthPrice: event({_from: uint256, _to: uint256})

#定义状态变量
price:public(uint256)

setter:public(address)


@public
def __init__():
    self.setter = msg.sender



@public
def setPrice(_price:uint256):
    assert msg.sender == self.setter
    log.SetEthPrice(self.price,_price)
    self.price = _price


@public
@constant
def USD(id:uint256) -> uint256:
    assert id == 0
    return self.price
