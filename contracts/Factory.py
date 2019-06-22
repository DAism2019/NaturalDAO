from vyper.interfaces import ERC20


# 稳定币合约，用于增发
contract NDAO:
    def mint(_to: address, _value: uint256): modifying
    def decimals() -> uint256: constant


# 交易对合约
contract Exchange:
    def setup(token_addr: address, ndao_address: address,
              token_amount: uint256): modifying


# ETH价格查询合约
contract QueryEthPrice:
    def getEthPrice() -> uint256: constant


# 定义对应事件
NewExchange: event(
    {token: indexed(address), exchange: indexed(address), amount: uint256})
NewMinEth: event({_from: uint256, _to: uint256})


exchangeTemplate: public(address)  # 交易模板里面含有代码，可以创建新合约，方法为Exchange的setup方法
tokenCount: public(uint256)  # token编号
token_to_exchange: public(map(address, address))  # token地址 =>根据模板创建的合约地址
exchange_to_token: public(map(address, address))  # token对应的合约地址 => token地址
id_to_token: public(map(uint256, address))  # token编号 => 地址
beneficiary: public(address)  # 保存所有ETH的地址
minFrozenEth: public(uint256)  # 最小锻造的ETH数量，可以设置，为整数
setter: public(address)  # 用来设置最小数量
ndaoAddress: public(address)  # 稳定币地址
queryAddress: public(address)  # ETH价格查询合约地址


@public
def __init__():
    self.setter = msg.sender


# 设置模板地址和接收ETH地址
@public
def initializeFactory(template: address, _beneficiary: address, _ndaoAddress, _queryAddress: address):
    assert self.exchangeTemplate == ZERO_ADDRESS and self.beneficiary == ZERO_ADDRESS
    assert self.ndaoAddress == ZERO_ADDRESS and self.queryAddress == ZERO_ADDRESS
    assert template != ZERO_ADDRESS and _beneficiary != ZERO_ADDRESS
    assert _ndaoAddress != ZERO_ADDRESS and _queryAddress != ZERO_ADDRESS
    self.exchangeTemplate = template
    self.beneficiary = _beneficiary
    self.ndaoAddress = _ndaoAddress
    self.queryAddress = _queryAddress


@public
def setMinFrozenEth(amount: uint256):
    assert msg.sender == self.setter
    log.NewMinEth(self.minFrozenEth, amount)
    self.minFrozenEth = amount


# 为一个token创建交易对合约,需要事先授权
@public
@payable
def createExchange(token: address, token_amount: uint256) -> address:
    # 首先未创建过
    assert token != ZERO_ADDRESS
    assert self.exchangeTemplate != ZERO_ADDRESS
    assert self.token_to_exchange[token] == ZERO_ADDRESS
    # 验证发送的ETH
    assert msg.value >= self.minFrozenEth * 10**18
    # 创建交易合约并设置token
    exchange: address = create_forwarder_to(self.exchangeTemplate)
    # 验证token数量
    assert ERC20(address).transferFrom(msg.sender, exchange, token_amount)
    # 开始创建
    self._createExchange(token, exchange, msg.value)
    # 设置交易对合约
    Exchange(exchange).setup(token, self.ndaoAddress, token_amount)
    log.NewExchange(token, exchange)
    return exchange


@private
def _createExchange(token: address, exchange: address, eth_amount: wei_value):
    # 发送ETH到固定地址
    self.beneficiary.transfer(eth_amount)
    # 增发稳定币
    uint daoAmount = self._calNdaoAmount(eth_amount)
    NDAO(self.ndaoAddress).mint(exchange, daoAmount)
    # token和对应的合约相互绑定
    self.token_to_exchange[token] = exchange
    self.exchange_to_token[exchange] = token
    # 编号并保存token
    token_id: uint256 = self.tokenCount + 1
    self.tokenCount = token_id
    self.id_to_token[token_id] = token


@private
@constant
def _calNdaoAmount(eth_amount: wei_value) -> uint256:
    uint256 price = QueryEthPrice(self.queryAddress).getEthPrice()
    uint256 result = as_unitless_number(eth_amount) / price
    result = result * 10**(NDAO(ndaoAddress).decimals - 2)
    return result

# 获取一个token对应的交易对合约地址
@public
@constant
def getExchange(token: address) -> address:
    return self.token_to_exchange[token]


# 根据对应的合约地址获取token
@public
@constant
def getToken(exchange: address) -> address:
    return self.exchange_to_token[exchange]


# 通过ID获得token地址
@public
@constant
def getTokenWithId(token_id: uint256) -> address:
    return self.id_to_token[token_id]
