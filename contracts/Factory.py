# @dev Implementation of control contract
# @author radarzhhua@gmail.com
from vyper.interfaces import ERC20


# the interface of NDAO ERC20 token contract
contract NDAO:
    def mint(_to: address, _value: uint256): modifying


# the interface of Exchange contract
contract Exchange:
    def setup(token_addr: address, ndao_address: address, token_amount: uint256, ndao_amount: uint256): modifying


# the interface of ICO contract
contract ICO:
    def setup(_name: string[64], _symbol: string[32], _decimals: uint256, _depositGoal: uint256,
              _deltaOfEnd: timedelta, _deltaOfSubmitssion: timedelta, token_price: uint256, _creater: address): modifying


# the interface of EthPrice contract
contract EthPriceContract:
    def ethToNdaoInputPrice(eth_sold: wei_value) -> uint256: constant
    def ethToNdaoOutPrice(ndao_bought: uint256) -> wei_value: constant


# vyper has no enum
STATUS_NONE: constant(uint256) = 0  # 0
STATUS_STARTED: constant(uint256) = 1  # 1
STATUS_SUCCESS: constant(uint256) = 2  # 2
STATUS_FAILED: constant(uint256) = 3  # 3
# the max amouts of icos  that can be created by one account
MAX_NUMBER: constant(int128) = 128


# events
NewExchange: event({_token: indexed(address), _exchange: indexed(address), _amount: uint256, _tokenAmount: uint256})
ICOCreated: event({_creater: indexed(address), _ico: address})
NewSetter: event({_from: indexed(address), _to: indexed(address)})
NewSubmitDelta: event({_newDelta: timedelta})
NdaoPurchase: event({buyer: indexed(address), recipient: indexed(address), amout: uint256})


# state variables
exchangeTemplate: public(address)  # exchange_template
icoTemplate: public(address)  # ico_template
tokenCount: public(uint256)  # token(exchange) number.
token_to_exchange: map(address, address)  # token_address => exchange_address
exchange_to_token: map(address, address)   # exchange_address => token_address
id_to_token: map(uint256, address)  # token id => token_address
beneficiary: public(address)  # the ethstore
ndaoAddress: public(address)  # ndao_address
ethPrice: public(EthPriceContract)  # the  instance of EthPriceContract
allIcoStatus: public(map(address, uint256))  # status of ico
allIcoSymbol: public(map(address, string[32]))  # symbol of ico (used by query)
# all icos that created by user
allIcoAddressOfUser: public(map(address, address[MAX_NUMBER]))
# the ico amounts created by user
allIcoCountsOfUser: public(map(address, int128))
allIcoCreater: public(map(address, address))  # the creater of ico
# the lastest submit time of ICO after ico end
submitssionDelta: public(timedelta)
setter: public(address)  # set the submitssionDelta


@public
def __init__():
    self.setter=msg.sender
    self.submitssionDelta=3 * 24 * 3600


@public
def setNewSetter(_newSetter: address):
    """
    # @dev transfer the setter
    # @param _newSetter new setter
    """
    assert _newSetter != ZERO_ADDRESS
    assert msg.sender == self.setter
    log.NewSetter(self.setter, _newSetter)
    self.setter=_newSetter


@public
def setSubmitssionDelta(_newDelta: timedelta):
    """
    # @dev update the  submitssionDelta
    # @param _newDelta new timedelta
    """
    assert _newDelta > 0
    assert msg.sender == self.setter
    self.submitssionDelta=_newDelta
    log.NewSubmitDelta(_newDelta)


@public
def initializeFactory(_exchangeTemplate: address, _beneficiary: address, _ndaoAddress: address, _priceAddress: address, _icoTemplate: address):
    """
    # @dev set templates address
    """
    assert self.exchangeTemplate == ZERO_ADDRESS and self.beneficiary == ZERO_ADDRESS
    assert self.ndaoAddress == ZERO_ADDRESS and self.ethPrice == ZERO_ADDRESS
    assert self.icoTemplate == ZERO_ADDRESS
    assert _exchangeTemplate != ZERO_ADDRESS and _beneficiary != ZERO_ADDRESS
    assert _ndaoAddress != ZERO_ADDRESS and _priceAddress != ZERO_ADDRESS
    assert _icoTemplate != ZERO_ADDRESS
    self.exchangeTemplate=_exchangeTemplate
    self.beneficiary=_beneficiary
    self.ndaoAddress=_ndaoAddress
    self.ethPrice=EthPriceContract(_priceAddress)
    self.icoTemplate=_icoTemplate


@public
def createICO(_name: string[64], _symbol: string[32], _decimals: uint256, _depositGoal: uint256, _delta: timedelta, _price: uint256):
    """
    # @dev create a ICO of ERC20 token
    # @param _name the name of token
    # @param _symbol the symbol of token
    # @param _decimals the decimals of token
    # @param _depositGoal the goal of ico deposit
    # @param _delta the duration of deposit
    # @param _price the amount of tokens that one ETH can exchange
    """
    assert self.icoTemplate != ZERO_ADDRESS
    assert self.allIcoCountsOfUser[msg.sender] < MAX_NUMBER
    ico: address=create_forwarder_to(self.icoTemplate)
    ICO(ico).setup(_name, _symbol, _decimals, _depositGoal,
                   _delta, self.submitssionDelta, _price, msg.sender)
    index: int128=self.allIcoCountsOfUser[msg.sender]
    self.allIcoCountsOfUser[msg.sender]=index + 1
    self.allIcoAddressOfUser[msg.sender][index]=ico
    self.allIcoStatus[ico]=STATUS_STARTED
    self.allIcoSymbol[ico]=_symbol
    self.allIcoCreater[ico]=msg.sender
    log.ICOCreated(msg.sender, ico)


@public
def cancelIco():
    """
    # @dev cancel the ico and can be called only once from the ico
    """
    assert self.allIcoStatus[msg.sender] == STATUS_STARTED
    self.allIcoStatus[msg.sender]=STATUS_FAILED


@public
@constant
def getAllIcoOfUser(creater: address) -> address[MAX_NUMBER]:
    """
    # @param creater the creater of ico
    # @return get all addresses of icos that be created by creater
    """
    return self.allIcoAddressOfUser[creater]


# risk:How to encapsulates the following six methods and relative events or variables in a isolated contract!
@private
def _buyNdaoInput(value: wei_value, buyer: address, recipient: address) -> uint256:
    send(self.beneficiary, value)
    amount: uint256=self.ethPrice.ethToNdaoInputPrice(value)
    NDAO(self.ndaoAddress).mint(recipient, amount)
    log.NdaoPurchase(buyer, recipient, amount)
    return amount


@public
@payable
def buyNdaoInputSwap() -> uint256:
    """
    # @return the amounts of ndao_bought
    """
    assert msg.value > 0
    return self._buyNdaoInput(msg.value, msg.sender, msg.sender)


@public
@payable
def buyNdaoInputTransfer(recipient: address) -> uint256:
    """
    # @param recipient The address that receives output Ndao.
    # @return the amounts of ndao_bought
    """
    assert msg.value > 0
    assert recipient != self and recipient != ZERO_ADDRESS
    return self._buyNdaoInput(msg.value, msg.sender, recipient)


@private
def _buyNdaoOutput(value: wei_value, ndao_bought: uint256, buyer: address, recipient: address) -> (wei_value, wei_value):
    eth_sold: wei_value=self.ethPrice.ethToNdaoOutPrice(ndao_bought)
    # Throws if eth_sold > msg.value
    eth_refund: wei_value=value - eth_sold
    send(self.beneficiary, eth_sold)
    if eth_refund > 0:
        send(buyer, eth_refund)
    NDAO(self.ndaoAddress).mint(recipient, ndao_bought)
    log.NdaoPurchase(buyer, recipient, ndao_bought)
    return (eth_sold, eth_refund)


@public
@payable
def buyNdaoOutputSwap(ndao_bought: uint256) -> (wei_value, wei_value):
    """
    # @param ndao_bought the amounts of ndao_bought
    # @return the amounts of eth_sold
    # @return the refund of eth
    """
    assert ndao_bought > 0 and msg.value > 0
    return self._buyNdaoOutput(msg.value, ndao_bought, msg.sender, msg.sender)


@public
@payable
def buyNdaoOutputTransfer(ndao_bought: uint256, recipient: address) -> (wei_value, wei_value):
    """
    # @param ndao_bought the amounts of ndao_bought
    # @param recipient The address that receives output Ndao.
    # @return the amounts of eth_sold
    # @return the refund of eth
    """
    assert ndao_bought > 0 and msg.value > 0
    assert recipient != self and recipient != ZERO_ADDRESS
    return self._buyNdaoOutput(msg.value, ndao_bought, msg.sender, msg.sender)


@private
def _saveExchangeInfo(token: address, exchange: address):
    self.token_to_exchange[token]=exchange
    self.exchange_to_token[exchange]=token
    token_id: uint256=self.tokenCount + 1
    self.tokenCount=token_id
    self.id_to_token[token_id]=token


@public
@payable
def createExchange():
    """
    # @dev Create a exchange when one ico is submit successful!
    # @notice Can be called only once from the ico!
    """
    assert msg.value > 0
    assert self.exchangeTemplate != ZERO_ADDRESS
    assert self.token_to_exchange[msg.sender] == ZERO_ADDRESS
    assert self.allIcoStatus[msg.sender] == STATUS_STARTED
    assert self.allIcoCreater[msg.sender] != ZERO_ADDRESS
    self.allIcoStatus[msg.sender]=STATUS_SUCCESS
    # create the exchange
    exchange: address=create_forwarder_to(self.exchangeTemplate)
    token_amount: uint256=ERC20(msg.sender).balanceOf(self)
    # transfer the token
    # attention:the use of "assert ERC20(msg.sender).transfer(exchange, token_amount)" has a error!!!
    flag: bool=ERC20(msg.sender).transfer(exchange, token_amount)
    assert flag
    # transfer the eth
    send(self.beneficiary, msg.value)
    # get the amount of ndao
    ndao_amount: uint256 = self.ethPrice.ethToNdaoInputPrice(msg.value)
    # set up the exchange contract
    Exchange(exchange).setup(msg.sender, self.ndaoAddress, token_amount, ndao_amount)
    # transfer ndao to the creater
    NDAO(self.ndaoAddress).mint(self.allIcoCreater[msg.sender], ndao_amount)
    # save infos
    self._saveExchangeInfo(msg.sender, exchange)
    log.NewExchange(msg.sender, exchange, ndao_amount, token_amount)


@public
@constant
def getExchange(token: address) -> address:
    """
    # @dev return address of exchange by token
    """
    return self.token_to_exchange[token]


@public
@constant
def getToken(exchange: address) -> address:
    """
    # @dev return address of token by exchange
    """
    return self.exchange_to_token[exchange]


@public
@constant
def getTokenWithId(token_id: uint256) -> address:
    """
    # @dev return address of token by id
    """
    return self.id_to_token[token_id]
