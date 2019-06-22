from vyper.interfaces import ERC20


# 控制合约接口,用来获得别的代币的交易对地址
contract Factory:
    def getExchange(token_addr: address) -> address: constant


# 定义交易合约的接口,是用来进行币币交易的
contract Exchange:
    def getNdaoToTokenOutputPrice(
        tokens_bought: uint256) -> wei_value: constant
    def ndaoToTokenTransferInput(
        min_tokens: uint256, deadline: timestamp, recipient: address) -> uint256: modifying
    def ndaoToTokenTransferOutput(
        tokens_bought: uint256, deadline: timestamp, recipient: address) -> wei_value: modifying


#定义事件
TokenPurchase: event({buyer: indexed(address), eth_sold: indexed(wei_value), tokens_bought: indexed(uint256)})
EthPurchase: event({buyer: indexed(address), tokens_sold: indexed(uint256), eth_bought: indexed(wei_value)})
AddLiquidity: event({provider: indexed(address), eth_amount: indexed(wei_value), token_amount: indexed(uint256)})
RemoveLiquidity: event({provider: indexed(address), eth_amount: indexed(wei_value), token_amount: indexed(uint256)})
Transfer: event({_from: indexed(address), _to: indexed(address), _value: uint256})
Approval: event({_owner: indexed(address), _spender: indexed(address), _value: uint256})


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
    input_amount_with_fee: uint256 = input_amount * 997
    numerator: uint256 = input_amount_with_fee * output_reserve
    denominator: uint256 = (input_reserve * 1000) + input_amount_with_fee
    return numerator / denominator


@private
@constant
def getOutputPrice(output_amount: uint256, input_reserve: uint256, output_reserve: uint256) -> uint256:
    """
    # @dev Pricing function for converting between ETH and Tokens.
    # @param output_amount Amount of ETH or Tokens being bought.
    # @param input_reserve Amount of ETH or Tokens (input type) in exchange reserves.
    # @param output_reserve Amount of ETH or Tokens (output type) in exchange reserves.
    # @return Amount of ETH or Tokens sold.
    """
    assert input_reserve > 0 and output_reserve > 0
    numerator: uint256 = input_reserve * output_amount * 1000
    denominator: uint256 = (output_reserve - output_amount) * 997
    return numerator / denominator + 1


#买入token
@private
def ndaoToTokenInput(eth_sold: wei_value, min_tokens: uint256, deadline: timestamp, buyer: address, recipient: address) -> uint256:
    assert deadline >= block.timestamp and (eth_sold > 0 and min_tokens > 0)
    token_reserve: uint256 = self.token.balanceOf(self)
    tokens_bought: uint256 = self.getInputPrice(as_unitless_number(eth_sold), as_unitless_number(self.balance - eth_sold), token_reserve)
    assert tokens_bought >= min_tokens
    assert self.token.transfer(recipient, tokens_bought)
    log.TokenPurchase(buyer, eth_sold, tokens_bought)
    return tokens_bought


#给自己买
@public
@payable
def ndaoToTokenSwapInput(min_tokens: uint256, deadline: timestamp) -> uint256:
    """
    # @notice Convert ETH to Tokens.
    # @dev User specifies exact input (msg.value) and minimum output.
    # @param min_tokens Minimum Tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of Tokens bought.
    """
    return self.ethToTokenInput(msg.value, min_tokens, deadline, msg.sender, msg.sender)


#帮别人买，但是花钱是自己的
@public
@payable
def ndaoToTokenTransferInput(min_tokens: uint256, deadline: timestamp, recipient: address) -> uint256:
    """
    # @notice Convert ETH to Tokens and transfers Tokens to recipient.
    # @dev User specifies exact input (msg.value) and minimum output
    # @param min_tokens Minimum Tokens bought.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output Tokens.
    # @return Amount of Tokens bought.
    """
    assert recipient != self and recipient != ZERO_ADDRESS
    return self.ethToTokenInput(msg.value, min_tokens, deadline, msg.sender, recipient)



#反向操作
@private
def tokenToNdaoInput(tokens_sold: uint256, min_eth: wei_value, deadline: timestamp, buyer: address, recipient: address) -> wei_value:
    assert deadline >= block.timestamp and (tokens_sold > 0 and min_eth > 0)
    token_reserve: uint256 = self.token.balanceOf(self)
    eth_bought: uint256 = self.getInputPrice(tokens_sold, token_reserve, as_unitless_number(self.balance))
    wei_bought: wei_value = as_wei_value(eth_bought, 'wei')
    assert wei_bought >= min_eth
    send(recipient, wei_bought)
    assert self.token.transferFrom(buyer, self, tokens_sold)
    log.EthPurchase(buyer, tokens_sold, wei_bought)
    return wei_bought

#反向交换
@public
def tokenToNdaoSwapInput(tokens_sold: uint256, min_eth: wei_value, deadline: timestamp) -> wei_value:
    """
    # @notice Convert Tokens to ETH.
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_eth Minimum ETH purchased.
    # @param deadline Time after which this transaction can no longer be executed.
    # @return Amount of ETH bought.
    """
    return self.tokenToEthInput(tokens_sold, min_eth, deadline, msg.sender, msg.sender)


@public
def tokenToNdaoTransferInput(tokens_sold: uint256, min_eth: wei_value, deadline: timestamp, recipient: address) -> wei_value:
    """
    # @notice Convert Tokens to ETH and transfers ETH to recipient.
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_eth Minimum ETH purchased.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output ETH.
    # @return Amount of ETH bought.
    """
    assert recipient != self and recipient != ZERO_ADDRESS
    return self.tokenToEthInput(tokens_sold, min_eth, deadline, msg.sender, recipient)


#币币交易
@private
def tokenToTokenInput(tokens_sold: uint256, min_tokens_bought: uint256, min_eth_bought: wei_value, deadline: timestamp, buyer: address, recipient: address, exchange_addr: address) -> uint256:
    assert (deadline >= block.timestamp and tokens_sold > 0) and (min_tokens_bought > 0 and min_eth_bought > 0)
    assert exchange_addr != self and exchange_addr != ZERO_ADDRESS
    token_reserve: uint256 = self.token.balanceOf(self)
    eth_bought: uint256 = self.getInputPrice(tokens_sold, token_reserve, as_unitless_number(self.balance))
    wei_bought: wei_value = as_wei_value(eth_bought, 'wei')
    assert wei_bought >= min_eth_bought
    assert self.token.transferFrom(buyer, self, tokens_sold)
    tokens_bought: uint256 = Exchange(exchange_addr).ethToTokenTransferInput(min_tokens_bought, deadline, recipient, value=wei_bought)
    log.EthPurchase(buyer, tokens_sold, wei_bought)
    return tokens_bought



@public
def tokenToTokenSwapInput(tokens_sold: uint256, min_tokens_bought: uint256, min_eth_bought: wei_value, deadline: timestamp, token_addr: address) -> uint256:
    """
    # @notice Convert Tokens (self.token) to Tokens (token_addr).
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_tokens_bought Minimum Tokens (token_addr) purchased.
    # @param min_eth_bought Minimum ETH purchased as intermediary.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param token_addr The address of the token being purchased.
    # @return Amount of Tokens (token_addr) bought.
    """
    exchange_addr: address = self.factory.getExchange(token_addr)
    return self.tokenToTokenInput(tokens_sold, min_tokens_bought, min_eth_bought, deadline, msg.sender, msg.sender, exchange_addr)


@public
def tokenToTokenTransferInput(tokens_sold: uint256, min_tokens_bought: uint256, min_eth_bought: wei_value, deadline: timestamp, recipient: address, token_addr: address) -> uint256:
    """
    # @notice Convert Tokens (self.token) to Tokens (token_addr) and transfers
    #         Tokens (token_addr) to recipient.
    # @dev User specifies exact input and minimum output.
    # @param tokens_sold Amount of Tokens sold.
    # @param min_tokens_bought Minimum Tokens (token_addr) purchased.
    # @param min_eth_bought Minimum ETH purchased as intermediary.
    # @param deadline Time after which this transaction can no longer be executed.
    # @param recipient The address that receives output ETH.
    # @param token_addr The address of the token being purchased.
    # @return Amount of Tokens (token_addr) bought.
    """
    exchange_addr: address = self.factory.getExchange(token_addr)
    return self.tokenToTokenInput(tokens_sold, min_tokens_bought, min_eth_bought, deadline, msg.sender, recipient, exchange_addr)


@public
@constant
def getEthToTokenInputPrice(eth_sold: wei_value) -> uint256:
    """
    # @notice Public price function for ETH to Token trades with an exact input.
    # @param eth_sold Amount of ETH sold.
    # @return Amount of Tokens that can be bought with input ETH.
    """
    assert eth_sold > 0
    token_reserve: uint256 = self.token.balanceOf(self)
    return self.getInputPrice(as_unitless_number(eth_sold), as_unitless_number(self.balance), token_reserve)


@public
@constant
def getTokenToEthInputPrice(tokens_sold: uint256) -> wei_value:
    """
    # @notice Public price function for Token to ETH trades with an exact input.
    # @param tokens_sold Amount of Tokens sold.
    # @return Amount of ETH that can be bought with input Tokens.
    """
    assert tokens_sold > 0
    token_reserve: uint256 = self.token.balanceOf(self)
    eth_bought: uint256 = self.getInputPrice(tokens_sold, token_reserve, as_unitless_number(self.balance))
    return as_wei_value(eth_bought, 'wei')


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
def getMaxPool() -> uint:
    """
    # @return maxPool of token on this exchange.
    """
    return self.maxPool
