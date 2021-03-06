# @dev Implementation of ico for ERC-20 token .
# @author radarzhhua@gmail.com
# @refernce https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
from vyper.interfaces import ERC20
implements: ERC20


# define the interface of Factory contract
contract Factory:
    def createExchange(): modifying
    def cancelIco(): modifying


ETHER_TO_WEI: constant(uint256) = 10 ** 18


# events of ERC-20
Transfer: event(
    {_from: indexed(address), _to: indexed(address), _value: uint256})
Approval: event({_owner: indexed(address),
                 _spender: indexed(address), _value: uint256})
# event of ICO
Deposit: event({_depositor: indexed(address), _amount: uint256(wei)})
RefundTransfer: event({_drawer: indexed(address), _amount: uint256(wei)})
CancelIco: event({_cancer: address})
SubmitIco: event({_creater: address})

# ERC20 state variables
name: public(string[64])
symbol: public(string[32])
decimals: public(uint256)
balanceOf: public(map(address, uint256))
allowances: map(address, map(address, uint256))
total_supply: uint256
# ICO state varialbes
depositGoal: public(wei_value)  # ICO goal
depositStart: public(timestamp)  # ICO start time
depositEnd: public(timestamp)  # ICO end time
finalSubmissionTime: public(timestamp)  # ICO  lastest time of submit
isEnd: public(bool)  # ICO is end
goalReached: public(bool)  # ICO is in goal
isFailed: public(bool)  # ICO is failed
tokenPrice: public(uint256)  # 1 eth => tokenPrice tokens
depositAmount: public(wei_value)  # current amounts of deposit
depositBalanceOfUser: public(map(address, wei_value))  # user deposit
factory: public(Factory)  # Factory Contract instance
creater: public(address)   # ICO creater
reservedToken:public(uint256)  # the tokens of creater that reversed


@private
def mint(_to: address, _value: uint256):
    """
    # @dev Mint an amount of the token and assigns it to an account.
           This encapsulates the modification of balances such that the
           proper events are emitted.
    # @notice It can only be called internally at depositing or at the ending of a successful ico
           when the ico is not ended
    # @param _to The account that will receive the created tokens.
    # @param _value The amount that will be created.
    """
    assert _to != ZERO_ADDRESS
    self.total_supply += _value
    self.balanceOf[_to] += _value
    log.Transfer(ZERO_ADDRESS, _to, _value)


@public
def setup(_name: string[64], _symbol: string[32], _decimals: uint256, _depositGoal: uint256,
          _deltaOfEnd: timedelta, _deltaOfSubmitssion: timedelta, token_price: uint256, _creater: address,_reserved:uint256):
    """
    # @dev init the contract.
    # @notice the method is called once right after the contract is deployed
    # @param _name the name string of token
    # @param _symbol the symbol string of token
    # @param _decimals the decimals of token
    # @param _depositGoal the amout of Ethers(WEI) that can deposit in the ICO
    # @param _deltaOfEnd the duration of ICO (second)
    # @param _deltaOfSubmitssion the duration between depositEnd and finalSubmissionTime
    # @param token_price the amount of token that one ether can exchange
    # @param _reserved the tokens of creater that reversed
    """
    assert self.factory == ZERO_ADDRESS and _creater != ZERO_ADDRESS
    self.name = _name
    self.symbol = _symbol
    self.decimals = _decimals
    self.depositGoal = as_wei_value(_depositGoal, 'wei')
    self.depositStart = block.timestamp
    self.depositEnd = self.depositStart + _deltaOfEnd
    self.finalSubmissionTime = self.depositEnd + _deltaOfSubmitssion
    self.tokenPrice = token_price
    self.creater = _creater
    self.reservedToken = _reserved
    self.factory = Factory(msg.sender)
    self.mint(_creater,_reserved)


@public
@constant
def totalSupply() -> uint256:
    """
    # @dev Total number of tokens in existence.
    """
    return self.total_supply


@public
@constant
def allowance(_owner: address, _spender: address) -> uint256:
    """
    # @dev Function to check the amount of tokens that an owner allowed to a spender.
    # @param _owner The address which owns the funds.
    # @param _spender The address which will spend the funds.
    # @return An uint256 specifying the amount of tokens still available for the spender.
    """
    return self.allowances[_owner][_spender]


@public
def transfer(_to: address, _value: uint256) -> bool:
    """
    # @dev Transfer token for a specified address
    # @param _to The address to transfer to.
    # @param _value The amount to be transferred.
    """
    self.balanceOf[msg.sender] -= _value
    self.balanceOf[_to] += _value
    log.Transfer(msg.sender, _to, _value)
    return True


@public
def transferFrom(_from: address, _to: address, _value: uint256) -> bool:
    """
     # @dev Transfer tokens from one address to another.
     #       Note that while this function emits a Transfer event, this is not required as per the specification,
     #       and other compliant implementations may not emit the event.
     # @param _from address The address which you want to send tokens from
     # @param _to address The address which you want to transfer to
     # @param _value uint256 the amount of tokens to be transferred
    """
    self.balanceOf[_from] -= _value
    self.balanceOf[_to] += _value
    self.allowances[_from][msg.sender] -= _value
    log.Transfer(_from, _to, _value)
    return True


@public
def approve(_spender: address, _value: uint256) -> bool:
    """
    # @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
           Beware that changing an allowance with this method brings the risk that someone may use both the old
           and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
           race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
           https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    # @param _spender The address which will spend the funds.
    # @param _value The amount of tokens to be spent.
    """
    self.allowances[msg.sender][_spender] = _value
    log.Approval(msg.sender, _spender, _value)
    return True


@private
def _checkDeposit(sender: address, value: wei_value):
    """
    # @dev Receive the ether and mint proper tokens
    # @param value The amount of the ether.
    # @param sender The address that prepare to be minted .
    """
    assert block.timestamp <= self.depositEnd, 'the ico has timeout'
    assert not self.goalReached, 'the goal of ico has reached'
    if self.depositAmount + value >= self.depositGoal:
        self.goalReached = True
        _refund: wei_value = self.depositAmount + value - self.depositGoal
        _deposit_amount: wei_value = self.depositGoal - self.depositAmount
        self.depositAmount += _deposit_amount
        self.depositBalanceOfUser[sender] += _deposit_amount
        _token_amount: uint256 = as_unitless_number(
            _deposit_amount) * self.tokenPrice / ETHER_TO_WEI
        self.mint(sender, _token_amount)
        send(sender, _refund)
        log.Deposit(sender, _deposit_amount)
    else:
        self.depositAmount += value
        self.depositBalanceOfUser[sender] += value
        _token_amount: uint256 = as_unitless_number(
            value) * self.tokenPrice / ETHER_TO_WEI
        self.mint(sender, _token_amount)
        log.Deposit(sender, value)


@public
@payable
def __default__():
    """
    # @dev  receive Ether(without data).
    """
    self._checkDeposit(msg.sender, msg.value)


@public
@payable
def deposit():
    """
    # @dev  receive Ether(with data).
    """
    self._checkDeposit(msg.sender, msg.value)


@public
def cancelICO():
    """
    # @dev  cancel the ICO ,this is called only once by creater after ended or by anyonde after finalSubmissionTime
    """
    assert block.timestamp > self.depositEnd and (not self.isFailed)
    assert not self.isEnd
    self.isFailed = True
    self.isEnd = True
    if block.timestamp <= self.finalSubmissionTime:
        assert msg.sender == self.creater
        self.factory.cancelIco()
    else:
        self.factory.cancelIco()
    log.CancelIco(msg.sender)


@public
def submitICO():
    """
    # @dev  submit the ICO  only once by creater after the ico is out end time
    """
    assert block.timestamp > self.depositEnd and block.timestamp <= self.finalSubmissionTime
    assert msg.sender == self.creater and (not self.isEnd)
    assert self.goalReached
    self.isEnd = True
    self.mint(self.factory, self.total_supply)
    self.factory.createExchange(value=self.depositGoal)
    log.SubmitIco(msg.sender)


@public
def safeWithdrawal():
    """
    #  @dev when ico is ended and failed,the user withdraws their deposit ethers.
            this function is using the withdrawal pattern.
    """
    assert self.isEnd and self.isFailed, 'the ico has not ended or the ico is successful'
    amount: wei_value = self.depositBalanceOfUser[msg.sender]
    assert amount > 0
    self.depositBalanceOfUser[msg.sender] = 0
    send(msg.sender, amount)
    log.RefundTransfer(msg.sender, amount)


@private
def _burn(_to: address, _value: uint256):
    """
    #  @dev Internal function that burns an amount of the token of a given
         account.
    # @param _to The account whose tokens will be burned.
    # @param _value The amount that will be burned.
    """
    assert _to != ZERO_ADDRESS
    self.total_supply -= _value
    self.balanceOf[_to] -= _value
    log.Transfer(_to, ZERO_ADDRESS, _value)


@public
def burn(_value: uint256):
    """
    # @dev Burn an amount of the token of msg.sender.
    # @param _value The amount that will be burned.
    """
    self._burn(msg.sender, _value)


@public
def burnFrom(_to: address, _value: uint256):
    """
    # @dev Burn an amount of the token from a given account.
    # @param _to The account whose tokens will be burned.
    # @param _value The amount that will be burned.
    """
    self.allowances[_to][msg.sender] -= _value
    self._burn(_to, _value)


@public
@constant
def getTokenInfo() -> (string[64], string[32], uint256):
    """
    # @dev Function to return the  description of token.
    """
    return (self.name, self.symbol, self.decimals)


@public
@constant
def getIcoInfo() -> (string[64], string[32], uint256, wei_value, timestamp, timestamp, timestamp, bool, bool, bool, uint256, wei_value, address,uint256):
    """
    # @dev Function to return the detail of ICO.
    """
    return (self.name, self.symbol, self.decimals, self.depositGoal, self.depositStart, self.depositEnd, self.finalSubmissionTime,
            self.isEnd, self.goalReached, self.isFailed, self.tokenPrice, self.depositAmount, self.creater,self.reservedToken)
