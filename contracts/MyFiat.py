# @dev the actual contract that set the price of ETH in USD
# @author radarzhhua@gmail.com


# events
SetEthPrice: event({_from: uint256, _to: uint256})
RequestUpdate: event({_id: uint256})
NewSetter: event({_from: indexed(address), _to: indexed(address)})


# state varialbes
price: public(uint256)     # $0.01  => wei
setter: public(address)


@public
def __init__():
    self.setter = msg.sender


@public
def setNewSetter(_newSetter: address):
    """
    # @dev set the new setter
    # @param _newSetter the address of new setter
    """
    assert _newSetter != ZERO_ADDRESS
    assert msg.sender == self.setter
    log.NewSetter(self.setter, _newSetter)
    self.setter = _newSetter


@public
@payable
def requestUpdate(id: uint256):
    """
    # @dev public function for requesting an updated price from server
    #      using this function requires a payment of 0.001 ETH
    # @param id  the id of multi cryptocurrency, zero means ETH
    """
    assert id == 0
    need: wei_value = as_wei_value(1, 'finney')
    assert msg.value >= need
    send(self.setter, msg.value)
    log.RequestUpdate(id)


@public
def setPrice(_price: uint256):
    """
    # @dev set the price of ETH in USD
    # @param _price $0.01  => wei
    """
    assert msg.sender == self.setter
    log.SetEthPrice(self.price, _price)
    self.price = _price


@public
@constant
def USD(id: uint256) -> uint256:
    """
    # @param the id of multi cryptocurrency, zero means ETH
    # @returns $0.01 worth of ETH in USD.
    """
    assert id == 0
    return self.price
