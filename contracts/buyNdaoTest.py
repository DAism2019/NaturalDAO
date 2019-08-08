contract Factory:
    def buyNdaoOutputSwap(
        ndao_bought: uint256, deadline: timestamp) -> (wei_value, wei_value): modifying


factory: public(Factory)


@public
def __init__(_factory: address):
    self.factory = Factory(_factory)


@public
@payable
def __default__():
    """
    # @dev  receive Ether(without data).
    """
    pass


@public
@payable
def buyNdao(ndao_bought: uint256, deadline: timestamp):
    self.factory.buyNdaoOutputSwap(ndao_bought, deadline, value=msg.value)
