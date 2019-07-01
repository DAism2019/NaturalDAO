from vyper.interfaces import ERC20


# 控制合约接口,用来获得别的代币的交易对地址
contract Factory:
    def getExchange(token_addr: address) -> address: constant


# 定义交易合约的接口,是用来进行币币交易的
contract Exchange:
    def ndaoToTokenTransferInput(ndao_sold: uint256, min_tokens: uint256,
                                 deadline: timestamp, recipient: address) -> uint256: modifying


# 定义事件
TokenPurchase: event({buyer: indexed(address), ndao_sold: indexed(
    uint256), tokens_bought: indexed(uint256)})
NdaoPurchase: event({buyer: indexed(address), tokens_sold: indexed(
    uint256), ndao_bought: indexed(uint256)})
TokenToTokenPurchase: event({buyer: indexed(
    address), tokenAddress: address, tokens_sold: uint256, token_bought: uint256})


# address of the ERC20 token traded on this contract
token: ERC20
# address of the NDAO Coin
ndao: ERC20
# interface for the factory that created this contract
factory: Factory
# Max amounts of token on this contract
maxPool: uint256


# @dev This function acts as a contract constructor which is not currently supported in contracts deployed
#      using create_with_code_of(). It is called once by the factory during contract creation.
@public
def setup(token_addr: address, ndao_address: address, token_amount: uint256):
    assert self.factory == ZERO_ADDRESS and self.token == ZERO_ADDRESS and self.ndao == ZERO_ADDRESS
    assert token_addr != ZERO_ADDRESS and ndao_address != ZERO_ADDRESS and token_amount > 0
    self.factory = Factory(msg.sender)
    self.token = ERC20(token_addr)
    self.ndao = ERC20(ndao_address)
    self.maxPool = token_amount * 2


@private
@constant
def getInputPrice(input_amount: uint256, input_reserve: uint256, output_reserve: uint256) -> uint256:
    """
    # @dev Pricing function for converting between NDAO and Tokens.
    # @param input_amount Amount of NDAO or Tokens being sold.
    # @param input_reserve Amount of NDAO or Tokens (input type) in exchange reserves.
    # @param output_reserve Amount of NDAO or Tokens (output type) in exchange reserves.
    # @return Amount of NDAO or Tokens bought.
    """
    assert input_reserve > 0 and output_reserve > 0
    numerator: uint256 = input_amount * output_reserve
    denominator: uint256 = input_reserve + input_amount
    return numerator / denominator


# 买入token
@private
def ndaoToTokenInput(ndao_sold: uint256, min_tokens: uint256, deadline: timestamp, buyer: address, recipient: address) -> uint256:
    assert deadline >= block.timestamp and (ndao_sold > 0 and min_tokens > 0)
    token_reserve: uint256 = self.token.balanceOf(self)
    ndao_reserve: uint256 = self.ndao.balanceOf(self)
    tokens_bought: uint256 = self.getInputPrice(
        ndao_sold, ndao_reserve, token_reserve)
    assert tokens_bought >= min_tokens, 'little than min_tokens'
    flag: bool = self.ndao.transferFrom(buyer, self, ndao_sold)
    assert flag, 'transfer ndao failed'
    flag = self.token.transfer(recipient, tokens_bought)
    assert flag, 'transfer token failed'
    log.TokenPurchase(buyer, ndao_sold, tokens_bought)
    return tokens_bought


# 给自己买
@public
def ndaoToTokenSwapInput(ndao_sold: uint256, min_tokens: uint256, deadline: timestamp) -> uint256:
    """
    # @notice Convert NDAO to Tokens.
    # @notice need Approve
    # @dev User specifies exact input  and minimum output.
    # @param ndao_sold amout of NDAO to sold
    # @param min_tokens Minimum Tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of Tokens bought.
    """
    return self.ndaoToTokenInput(ndao_sold, min_tokens, deadline, msg.sender, msg.sender)


# 帮别人买，但是花钱是自己的
@public
def ndaoToTokenTransferInput(ndao_sold: uint256, min_tokens: uint256, deadline: timestamp, recipient: address) -> uint256:
    """
    # @notice Convert NDAO to Tokens and transfers Tokens to recipient.
    # @notice Need Approve
    # @dev User specifies exact input  and minimum output
    # @param ndao_sold Amount of NDAO sold
    # @param min_tokens Minimum Tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output Tokens.
    # @return Amount of Tokens bought.
    """
    assert recipient != self and recipient != ZERO_ADDRESS
    return self.ndaoToTokenInput(ndao_sold, min_tokens, deadline, msg.sender, recipient)


# 反向操作,卖代币买NDAO
@private
def tokenToNdaoInput(tokens_sold: uint256, min_ndao: uint256, deadline: timestamp, buyer: address, recipient: address) -> uint256:
    assert deadline >= block.timestamp and (tokens_sold > 0 and min_ndao > 0)
    token_reserve: uint256 = self.token.balanceOf(self)
    assert token_reserve + tokens_sold <= self.maxPool, 'the pool is full'
    ndao_reserve: uint256 = self.ndao.balanceOf(self)
    ndao_bought: uint256 = self.getInputPrice(
        tokens_sold, token_reserve, ndao_reserve)
    assert ndao_bought >= min_ndao
    flag: bool = self.token.transferFrom(buyer, self, tokens_sold)
    assert flag
    flag = self.ndao.transfer(recipient, ndao_bought)
    assert flag
    log.NdaoPurchase(buyer, tokens_sold, ndao_bought)
    return ndao_bought


# 给自己买
@public
def tokenToNdaoSwapInput(tokens_sold: uint256, min_ndao: uint256, deadline: timestamp) -> uint256:
    """
    # @notice Convert Tokens to NDAO.
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_ndao Minimum NDAO purchased.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of NDAO bought.
    """
    return self.tokenToNdaoInput(tokens_sold, min_ndao, deadline, msg.sender, msg.sender)


# 给别人买
@public
def tokenToNdaoTransferInput(tokens_sold: uint256, min_ndao: uint256, deadline: timestamp, recipient: address) -> uint256:
    """
    # @notice Convert Tokens to NDAO and transfers NDAO to recipient.
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_ndao Minimum NDAO purchased.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output NDAO.
    # @return Amount of NDAO bought.
    """
    assert recipient != self and recipient != ZERO_ADDRESS
    return self.tokenToNdaoInput(tokens_sold, min_ndao, deadline, msg.sender, recipient)


# 币币交易
@private
def tokenToTokenInput(tokens_sold: uint256, min_tokens_bought: uint256, min_ndao_bought: uint256, deadline: timestamp, buyer: address, recipient: address, exchange_addr: address) -> uint256:
    assert (deadline >= block.timestamp and tokens_sold > 0) and (
        min_tokens_bought > 0 and min_ndao_bought > 0)
    assert exchange_addr != ZERO_ADDRESS
    token_reserve: uint256 = self.token.balanceOf(self)
    assert token_reserve + tokens_sold <= self.maxPool, 'the pool is full'
    ndao_reserve: uint256 = self.ndao.balanceOf(self)
    ndao_bought: uint256 = self.tokenToNdaoInput(
        tokens_sold, min_ndao_bought, deadline, buyer, self)
    # 这里需要授权
    self.ndao.approve(exchange_addr, ndao_bought)
    tokens_bought: uint256 = Exchange(exchange_addr).ndaoToTokenTransferInput(
        ndao_bought, min_tokens_bought, deadline, recipient)
    log.TokenToTokenPurchase(buyer, exchange_addr, tokens_sold, tokens_bought)
    return tokens_bought


@public
def tokenToTokenSwapInput(tokens_sold: uint256, min_tokens_bought: uint256, min_ndao_bought: uint256, deadline: timestamp, token_addr: address) -> uint256:
    """
    # @notice Convert Tokens (self.token) to Tokens (token_addr).
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_tokens_bought Minimum Tokens (token_addr) purchased.
    # @param min_ndao_bought Minimum NDAO purchased as intermediary.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param token_addr The address of the token being purchased.
    # @return Amount of Tokens (token_addr) bought.
    """
    exchange_addr: address = self.factory.getExchange(token_addr)
    return self.tokenToTokenInput(tokens_sold, min_tokens_bought, min_ndao_bought, deadline, msg.sender, msg.sender, exchange_addr)


@public
def tokenToTokenTransferInput(tokens_sold: uint256, min_tokens_bought: uint256, min_ndao_bought: uint256, deadline: timestamp, recipient: address, token_addr: address) -> uint256:
    """
    # @notice Convert Tokens (self.token) to Tokens (token_addr) and transfers
    #         Tokens (token_addr) to recipient.
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_tokens_bought Minimum Tokens (token_addr) purchased.
    # @param min_ndao_bought Minimum NDAO purchased as intermediary.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output token.
    # @param token_addr The address of the token being purchased.
    # @return Amount of Tokens (token_addr) bought.
    """
    exchange_addr: address = self.factory.getExchange(token_addr)
    return self.tokenToTokenInput(tokens_sold, min_tokens_bought, min_ndao_bought, deadline, msg.sender, recipient, exchange_addr)


@public
@constant
def getNdaoToTokenInputPrice(ndao_sold: uint256) -> uint256:
    """
    # @notice Public price function for NDAO to Token trades with an exact input.
    # @param ndao_sold Amount of NDAO sold.
    # @return Amount of Tokens that can be bought with input NDAO.
    """
    assert ndao_sold > 0
    token_reserve: uint256 = self.token.balanceOf(self)
    ndao_reserve: uint256 = self.ndao.balanceOf(self)
    return self.getInputPrice(ndao_sold, ndao_reserve, token_reserve)


@public
@constant
def getTokenToNdaoInputPrice(tokens_sold: uint256) -> uint256:
    """
    # @notice Public price function for Token to NDAO trades with an exact input.
    # @param tokens_sold Amount of Tokens sold.
    # @return Amount of NDAO that can be bought with input Tokens.
    """
    assert tokens_sold > 0
    token_reserve: uint256 = self.token.balanceOf(self)
    if token_reserve + tokens_sold > self.maxPool:
        return 0
    ndao_reserve: uint256 = self.ndao.balanceOf(self)
    ndao_bought: uint256 = self.getInputPrice(
        tokens_sold, token_reserve, ndao_reserve)
    return ndao_bought


@public
@constant
def tokenAddress() -> address:
    """
    # @return Address of Token that is sold on this exchange.
    """
    return self.token


@public
@constant
def factoryAddress() -> address(Factory):
    """
    # @return Address of factory that created this exchange.
    """
    return self.factory


@public
@constant
def ndaoAddress() -> address:
    """
    # @return Address of ndao tokens.
    """
    return self.ndao


@public
@constant
def getMaxPool() -> uint256:
    """
    # @return maxPool of token on this exchange.
    """
    return self.maxPool
