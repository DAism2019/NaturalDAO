# @title The Eth And Ndao Price Interface V1
# @author radarzhhua@gmail.com
# @refernce Fiat Contract  url:https://fiatcontract.com/
contract FiatContract:
    def USD(_id: uint256) -> uint256: constant
    def requestUpdate(_id: uint256): modifying


# state variables
# instance of FiatContract
fiator: public(FiatContract)
# owner that can set the  instance of FiatContract
owner: public(address)
# decimals of NDAO token
NDAO_DECIMALS: constant(uint256) = 18


@public
def __init__():
    self.owner = msg.sender


@public
def setFiator(_faitor: address):
    """
    # @param _faitor the address of FiatContract's instance
    """
    assert msg.sender == self.owner and _faitor != ZERO_ADDRESS
    self.fiator = FiatContract(_faitor)


@public
@constant
def getEthPrice() -> uint256:
    """
    # @returns $0.01  => wei
    """
    return self.fiator.USD(0)


@public
@payable
def updateEthPrice() -> bool:
    """
    @dev send a signal to update price
    """
    self.fiator.requestUpdate(0, value=msg.value)
    return True


@public
@constant
def ethToNdaoInputPrice(eth_sold: wei_value) -> uint256:
    """
    # @param eth_amount The amount of eth to be sold.
    # @return return the amount of ndao output
    """
    price: uint256 = self.getEthPrice()
    result: uint256 = as_unitless_number(
        eth_sold) * 10**NDAO_DECIMALS / (100 * price)
    return result


@public
@constant
def ethToNdaoOutPrice(ndao_bought: uint256) -> wei_value:
    """
    # @param ndao_bought The amount of ndao to be bought.
    # @return return the amount of eth_sold
    """
    price: uint256 = self.getEthPrice()
    result: uint256 = (100 * price * ndao_bought / 10**NDAO_DECIMALS) + 1
    return as_wei_value(result, 'wei')
