# @title NaturalDAO Exchange Interface V1
# @notice Use at your own risk
# @refernce The exchange contract of uniswap
from vyper.interfaces import ERC20


# the interface of Factory
contract Factory:
    def getExchange(token_addr: address) -> address: constant
    def buyNdaoInputSwap(min_ndao: uint256, deadline: timestamp) -> uint256: modifying
    def buyNdaoOutputSwap(ndao_bought: uint256, deadline: timestamp) -> (wei_value, wei_value): modifying


# the interface of Exchange
contract Exchange:
    def getNdaoToTokenOutputPrice(tokens_bought: uint256) -> uint256: constant
    def ndaoToTokenTransferInput(ndao_sold: uint256, min_tokens: uint256,
                                 deadline: timestamp, recipient: address) -> uint256: modifying
    def ndaoToTokenTransferOutput(
        tokens_bought: uint256, max_ndao: uint256, deadline: timestamp, recipient: address) -> uint256: modifying


# events
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
# virtual ndao amounts
ndaoAmount: uint256


# init the exchange
@public
def setup(token_addr: address, ndao_address: address, token_amount: uint256, ndao_amount: uint256):
    assert self.factory == ZERO_ADDRESS and self.token == ZERO_ADDRESS and self.ndao == ZERO_ADDRESS
    assert token_addr != ZERO_ADDRESS and ndao_address != ZERO_ADDRESS
    assert ndao_amount > 0 and token_amount > 0
    self.factory = Factory(msg.sender)
    self.token = ERC20(token_addr)
    self.ndao = ERC20(ndao_address)
    self.ndaoAmount = ndao_amount
    self.maxPool = token_amount


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


@private
@constant
def getOutputPrice(output_amount: uint256, input_reserve: uint256, output_reserve: uint256) -> uint256:
    """
    # @dev Pricing function for converting between NDAO and Tokens.
    # @param output_amount Amount of NDAO or Tokens being bought.
    # @param input_reserve Amount of NDAO or Tokens (input type) in exchange reserves.
    # @param output_reserve Amount of NDAO or Tokens (output type) in exchange reserves.
    # @return Amount of NDAO or Tokens sold.
    """
    assert input_reserve > 0 and output_reserve > 0
    numerator: uint256 = input_reserve * output_amount
    denominator: uint256 = output_reserve - output_amount
    return numerator / denominator + 1


@private
def ndaoToTokenInput(ndao_sold: uint256, min_tokens: uint256, deadline: timestamp, buyer: address, recipient: address, transNdao: bool) -> uint256:
    assert deadline >= block.timestamp and (ndao_sold > 0 and min_tokens > 0)
    token_reserve: uint256 = self.token.balanceOf(self)
    ndao_reserve: uint256 = self.ndaoAmount
    tokens_bought: uint256 = self.getInputPrice(
        ndao_sold, ndao_reserve, token_reserve)
    # Throws if tokens_bought < min_tokens
    assert tokens_bought >= min_tokens, 'little than min_tokens'
    flag: bool
    if transNdao:
        flag = self.ndao.transferFrom(buyer, self, ndao_sold)
        assert flag, 'transfer ndao failed'
    self.ndaoAmount += ndao_sold
    flag = self.token.transfer(recipient, tokens_bought)
    assert flag, 'transfer token failed'
    log.TokenPurchase(buyer, ndao_sold, tokens_bought)
    return tokens_bought


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
    return self.ndaoToTokenInput(ndao_sold, min_tokens, deadline, msg.sender, msg.sender, True)


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
    return self.ndaoToTokenInput(ndao_sold, min_tokens, deadline, msg.sender, recipient, True)


@public
@payable
def ethToTokenSwapInput(min_tokens: uint256, deadline: timestamp) -> uint256:
    """
    # @notice Convert ETH to Tokens.
    # @dev User specifies exact input  and minimum output.
    # @param min_tokens Minimum Tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of Tokens bought.
    """
    assert msg.value > 0
    ndao_sold: uint256 = self.factory.buyNdaoInputSwap(1,deadline,value=msg.value)
    return self.ndaoToTokenInput(ndao_sold, min_tokens, deadline, msg.sender, msg.sender, False)


@public
@payable
def ethToTokenTransferInput(min_tokens: uint256, deadline: timestamp, recipient: address) -> uint256:
    """
    # @notice Convert ETH to Tokens and transfers Tokens to recipient.
    # @dev User specifies exact input  and minimum output
    # @param min_tokens Minimum Tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output Tokens.
    # @return Amount of Tokens bought.
    """
    assert msg.value > 0
    assert recipient != self and recipient != ZERO_ADDRESS
    ndao_sold: uint256 = self.factory.buyNdaoInputSwap(1,deadline,value=msg.value)
    return self.ndaoToTokenInput(ndao_sold, min_tokens, deadline, msg.sender, recipient, False)


@private
def ndaoToTokenOutput(tokens_bought: uint256, max_ndao: uint256, deadline: timestamp, buyer: address, recipient: address) -> uint256:
    assert deadline >= block.timestamp and (tokens_bought > 0 and max_ndao > 0)
    token_reserve: uint256 = self.token.balanceOf(self)
    ndao_reserve: uint256 = self.ndaoAmount
    ndao_sold: uint256 = self.getOutputPrice(
        tokens_bought, ndao_reserve, token_reserve)
    # Throws if ndao_sold > max_ndao
    assert ndao_sold <= max_ndao, 'beyond max_ndao'
    flag: bool = self.ndao.transferFrom(buyer, self, ndao_sold)
    assert flag, 'transfer ndao failed'
    self.ndaoAmount += ndao_sold
    flag = self.token.transfer(recipient, tokens_bought)
    assert flag, 'transfer token failed'
    log.TokenPurchase(buyer, ndao_sold, tokens_bought)
    return ndao_sold


@public
def ndaoToTokenSwapOutput(tokens_bought: uint256, max_ndao: uint256, deadline: timestamp) -> uint256:
    """
    # @notice Convert NDAO to Tokens.
    # @notice need Approve
    # @dev User specifies maximum input max_ndao and exact output.
    # @param tokens_bought Amount of tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of NDAO sold.
    """
    return self.ndaoToTokenOutput(tokens_bought, max_ndao, deadline, msg.sender, msg.sender)


@public
def ndaoToTokenTransferOutput(tokens_bought: uint256, max_ndao: uint256, deadline: timestamp, recipient: address) -> uint256:
    """
    # @notice Convert NDAO to Tokens and transfers Tokens to recipient.
    # @notice need Approve
    # @dev User specifies maximum input max_ndao and exact output.
    # @param tokens_bought Amount of tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output Tokens.
    # @return Amount of NDAO sold.
    """
    assert recipient != self and recipient != ZERO_ADDRESS
    return self.ndaoToTokenOutput(tokens_bought, max_ndao, deadline, msg.sender, recipient)


@private
def ethToTokenOutput(eth_value: wei_value, tokens_bought: uint256,  deadline: timestamp, buyer: address, recipient: address) -> wei_value:
    assert deadline >= block.timestamp and tokens_bought > 0
    token_reserve: uint256 = self.token.balanceOf(self)
    ndao_reserve: uint256 = self.ndaoAmount
    ndao_sold: uint256 = self.getOutputPrice(tokens_bought, ndao_reserve, token_reserve)
    # need deal the refund
    eth_sold: wei_value
    eth_refund: wei_value
    (eth_sold, eth_refund) = self.factory.buyNdaoOutputSwap(ndao_sold,deadline,value=eth_value)
    if eth_refund > 0:
        send(buyer, eth_refund)
    self.ndaoAmount += ndao_sold
    flag: bool = self.token.transfer(recipient, tokens_bought)
    assert flag, 'transfer token failed'
    log.TokenPurchase(buyer, ndao_sold, tokens_bought)
    return eth_sold


@public
@payable
def ethToTokenSwapOutput(tokens_bought: uint256,  deadline: timestamp) -> wei_value:
    """
    # @notice Convert eth to Tokens.
    # @dev User specifies  exact output.
    # @param tokens_bought Amount of tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of eth sold.
    """
    assert tokens_bought > 0 and msg.value > 0
    return self.ethToTokenOutput(msg.value, tokens_bought, deadline, msg.sender, msg.sender)


@public
@payable
def ethToTokenTransferOutput(tokens_bought: uint256, deadline: timestamp, recipient: address) -> wei_value:
    """
    # @notice Convert eth to Tokens.
    # @dev User specifies  exact output.
    # @param tokens_bought Amount of tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of eth sold.
    """
    assert tokens_bought > 0 and msg.value > 0
    assert recipient != self and recipient != ZERO_ADDRESS
    return self.ethToTokenOutput(msg.value, tokens_bought, deadline, msg.sender, recipient)


@private
def tokenToNdaoInput(tokens_sold: uint256, min_ndao: uint256, deadline: timestamp, buyer: address, recipient: address) -> uint256:
    assert deadline >= block.timestamp and (tokens_sold > 0 and min_ndao > 0)
    token_reserve: uint256 = self.token.balanceOf(self)
    assert token_reserve + tokens_sold <= self.maxPool, 'the pool is full'
    ndao_reserve: uint256 = self.ndaoAmount
    ndao_bought: uint256 = self.getInputPrice(
        tokens_sold, token_reserve, ndao_reserve)
    assert ndao_bought >= min_ndao
    flag: bool = self.token.transferFrom(buyer, self, tokens_sold)
    assert flag, 'transfer token failed'
    flag = self.ndao.transfer(recipient, ndao_bought)
    assert flag, 'transfer ndao failed'
    self.ndaoAmount -= ndao_bought
    log.NdaoPurchase(buyer, tokens_sold, ndao_bought)
    return ndao_bought


# buy self
@public
def tokenToNdaoSwapInput(tokens_sold: uint256, min_ndao: uint256, deadline: timestamp) -> uint256:
    """
    # @notice Convert Tokens to NDAO.
    # @notice need Approve
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_ndao Minimum NDAO purchased.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of NDAO bought.
    """
    return self.tokenToNdaoInput(tokens_sold, min_ndao, deadline, msg.sender, msg.sender)


# buy for others
@public
def tokenToNdaoTransferInput(tokens_sold: uint256, min_ndao: uint256, deadline: timestamp, recipient: address) -> uint256:
    """
    # @notice Convert Tokens to NDAO and transfers NDAO to recipient.
    # @notice need Approve
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_ndao Minimum NDAO purchased.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output NDAO.
    # @return Amount of NDAO bought.
    """
    assert recipient != self and recipient != ZERO_ADDRESS
    return self.tokenToNdaoInput(tokens_sold, min_ndao, deadline, msg.sender, recipient)


@private
def tokenToNdaoOutput(ndao_bought: uint256, max_tokens: uint256, deadline: timestamp, buyer: address, recipient: address) -> uint256:
    assert deadline >= block.timestamp and ndao_bought > 0
    token_reserve: uint256 = self.token.balanceOf(self)
    ndao_reserve: uint256 = self.ndaoAmount
    tokens_sold: uint256 = self.getOutputPrice(
        ndao_bought, token_reserve, ndao_reserve)
    assert token_reserve + tokens_sold <= self.maxPool, 'the pool is full'
    assert max_tokens >= tokens_sold, 'beyond max_tokens'
    flag: bool = self.token.transferFrom(buyer, self, tokens_sold)
    assert flag, 'transfer token failed'
    flag = self.ndao.transfer(recipient, ndao_bought)
    assert flag, 'transfer ndao failed'
    self.ndaoAmount -= ndao_bought
    log.NdaoPurchase(buyer, tokens_sold, ndao_bought)
    return tokens_sold


@public
def tokenToNdaoSwapOutput(ndao_bought: uint256, max_tokens: uint256, deadline: timestamp) -> uint256:
    """
    # @notice Convert Tokens to NDAO.
    # @notice need Approve
    # @dev User specifies maximum input and exact output.
    # @param ndao_bought Amount of NDAO purchased.
    # @param max_tokens Maximum Tokens sold.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of Tokens sold.
    """
    return self.tokenToNdaoOutput(ndao_bought, max_tokens, deadline, msg.sender, msg.sender)


@public
def tokenToNdaoTransferOutput(ndao_bought: uint256, max_tokens: uint256, deadline: timestamp, recipient: address) -> uint256:
    """
    # @notice Convert Tokens to NDAO and transfers NDAO to recipient.
    # @notice need Approve
    # @dev User specifies maximum input and exact output.
    # @param ndao_bought Amount of NDAO purchased.
    # @param max_tokens Maximum Tokens sold.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output NDAO.
    # @return Amount of Tokens sold.
    """
    assert recipient != self and recipient != ZERO_ADDRESS
    return self.tokenToNdaoOutput(ndao_bought, max_tokens, deadline, msg.sender, recipient)


@private
def tokenToTokenInput(tokens_sold: uint256, min_tokens_bought: uint256, min_ndao_bought: uint256, deadline: timestamp, buyer: address, recipient: address, exchange_addr: address) -> uint256:
    assert (deadline >= block.timestamp and tokens_sold > 0) and (
        min_tokens_bought > 0 and min_ndao_bought > 0)
    assert exchange_addr != ZERO_ADDRESS
    token_reserve: uint256 = self.token.balanceOf(self)
    assert token_reserve + tokens_sold <= self.maxPool, 'the pool is full'
    ndao_bought: uint256 = self.tokenToNdaoInput(
        tokens_sold, min_ndao_bought, deadline, buyer, self)
    # attention: Transfer ndao need approve
    self.ndao.approve(exchange_addr, ndao_bought)
    tokens_bought: uint256 = Exchange(exchange_addr).ndaoToTokenTransferInput(
        ndao_bought, min_tokens_bought, deadline, recipient)
    log.TokenToTokenPurchase(buyer, exchange_addr, tokens_sold, tokens_bought)
    return tokens_bought


@public
def tokenToTokenSwapInput(tokens_sold: uint256, min_tokens_bought: uint256, min_ndao_bought: uint256, deadline: timestamp, token_addr: address) -> uint256:
    """
    # @notice Convert Tokens (self.token) to Tokens (token_addr).
    # @notice need Approve
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
    # @notice need Approve
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


@private
def tokenToTokenOutput(tokens_bought: uint256, max_tokens_sold: uint256, max_ndao_sold: uint256, deadline: timestamp, buyer: address, recipient: address, exchange_addr: address) -> uint256:
    assert deadline >= block.timestamp and (
        tokens_bought > 0 and max_ndao_sold > 0)
    assert exchange_addr != self and exchange_addr != ZERO_ADDRESS
    # cal ndao_transfer
    ndao_bought: uint256 = Exchange(
        exchange_addr).getNdaoToTokenOutputPrice(tokens_bought)
    assert ndao_bought <= max_ndao_sold
    tokens_sold: uint256 = self.tokenToNdaoOutput(
        ndao_bought, max_tokens_sold, deadline, buyer, self)
    # attention need approve
    self.ndao.approve(exchange_addr, ndao_bought)
    Exchange(exchange_addr).ndaoToTokenTransferOutput(
        tokens_bought, max_ndao_sold, deadline, recipient)
    log.TokenToTokenPurchase(buyer, exchange_addr, tokens_sold, tokens_bought)
    return tokens_sold


@public
def tokenToTokenSwapOutput(tokens_bought: uint256, max_tokens_sold: uint256, max_ndao_sold: uint256, deadline: timestamp, token_addr: address) -> uint256:
    """
    # @notice Convert Tokens (self.token) to Tokens (token_addr).
    # @notice need Approve
    # @dev User specifies maximum input and exact output.
    # @param tokens_bought Amount of Tokens (token_addr) bought.
    # @param max_tokens_sold Maximum Tokens (self.token) sold.
    # @param max_ndao_sold Maximum NDAO purchased as intermediary.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param token_addr The address of the token being purchased.
    # @return Amount of Tokens (self.token) sold.
    """
    exchange_addr: address = self.factory.getExchange(token_addr)
    return self.tokenToTokenOutput(tokens_bought, max_tokens_sold, max_ndao_sold, deadline, msg.sender, msg.sender, exchange_addr)


@public
def tokenToTokenTransferOutput(tokens_bought: uint256, max_tokens_sold: uint256, max_ndao_sold: uint256, deadline: timestamp, recipient: address, token_addr: address) -> uint256:
    """
    # @notice Convert Tokens (self.token) to Tokens (token_addr) and transfers
    #         Tokens (token_addr) to recipient.
    # @notice need Approve
    # @dev User specifies maximum input and exact output.
    # @param tokens_bought Amount of Tokens (token_addr) bought.
    # @param max_tokens_sold Maximum Tokens (self.token) sold.
    # @param max_ndao_sold Maximum NDAO purchased as intermediary.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output NDAO.
    # @param token_addr The address of the token being purchased.
    # @return Amount of Tokens (self.token) sold.
    """
    exchange_addr: address = self.factory.getExchange(token_addr)
    return self.tokenToTokenOutput(tokens_bought, max_tokens_sold, max_ndao_sold, deadline, msg.sender, recipient, exchange_addr)


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
    ndao_reserve: uint256 = self.ndaoAmount
    return self.getInputPrice(ndao_sold, ndao_reserve, token_reserve)


@public
@constant
def getNdaoToTokenOutputPrice(tokens_bought: uint256) -> uint256:
    """
    # @notice Public price function for Ndao to Token trades with an exact output.
    # @param tokens_bought Amount of Tokens bought.
    # @return Amount of NDAO needed to buy output Tokens.
    """
    assert tokens_bought > 0
    token_reserve: uint256 = self.token.balanceOf(self)
    ndao_reserve: uint256 = self.ndaoAmount
    return self.getOutputPrice(tokens_bought, ndao_reserve, token_reserve)


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
    ndao_reserve: uint256 = self.ndaoAmount
    return self.getInputPrice(tokens_sold, token_reserve, ndao_reserve)


@public
@constant
def getTokenToNdaoOutputPrice(ndao_bought: uint256) -> uint256:
    """
    # @notice Public price function for Token to NDAO trades with an exact output.
    # @param ndao_bought Amount of output NDAO.
    # @return Amount of Tokens needed to buy output NDAO.
    """
    assert ndao_bought > 0
    token_reserve: uint256 = self.token.balanceOf(self)
    ndao_reserve: uint256 = self.ndaoAmount
    return self.getOutputPrice(ndao_bought, token_reserve, ndao_reserve)


@public
@constant
def tokenAddress() -> address:
    """
    # @return Address of Token that is sold on this exchange.
    """
    return self.token


@public
@constant
def ndaoAddress() -> address:
    """
    # @return Address of NDAO that is sold on this exchange.
    """
    return self.ndao


@public
@constant
def factoryAddress() -> address(Factory):
    """
    # @return Address of factory that created this exchange.
    """
    return self.factory


@public
@constant
def getMaxPool() -> uint256:
    """
    # @return maxPool of token on this exchange.
    """
    return self.maxPool


@public
@constant
def getNdaoBalance() -> uint256:
    """
    # @return the balance of ndao in the contract
    """
    return self.ndao.balanceOf(self)


@public
@constant
def getNdaoReserve() -> uint256:
    """
    # @return the reverse of ndao in the contract
    """
    return self.ndaoAmount
