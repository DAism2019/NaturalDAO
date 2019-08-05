import React, { useState, useReducer, useEffect } from 'react'
import ReactGA from 'react-ga'
import { useTranslation } from 'react-i18next'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'
import styled from 'styled-components'

import { Button } from '../../theme'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import NewContextualInfo from '../../components/ContextualInfoNew'
import OversizedPanel from '../../components/OversizedPanel'
import ArrowDownBlue from '../../assets/images/arrow-down-blue.svg'
import ArrowDownGrey from '../../assets/images/arrow-down-grey.svg'
import { amountFormatter, calculateGasMargin } from '../../utils'
import { useExchangeContract,useFactoryContract } from '../../hooks'
import { useTokenDetails,setNdaoExchangeAddress} from '../../contexts/Tokens'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useAddressBalance, useExchangeReserves } from '../../contexts/Balances'
import { useAddressAllowance } from '../../contexts/Allowances'
import { NDAO_ADDRESSES } from "../../constants"
import { useEthPrice } from '../../contexts/EthPrice'

const INPUT = 0
const OUTPUT = 1

const ETH_TO_TOKEN = 0
// const TOKEN_TO_ETH = 1
const TOKEN_TO_TOKEN = 2
const ETH_TO_NDAO = 3
const NDAO_TO_TOKEN = 4
const TOKEN_TO_NDAO = 5

// denominated in bips
const ALLOWED_SLIPPAGE = ethers.utils.bigNumberify(200)
const TOKEN_ALLOWED_SLIPPAGE = ethers.utils.bigNumberify(400)

// denominated in seconds
const DEADLINE_FROM_NOW = 60 * 15

// denominated in bips
const GAS_MARGIN = ethers.utils.bigNumberify(1000)

const BlueSpan = styled.span`
  color: ${({ theme }) => theme.royalBlue};
`

const LastSummaryText = styled.div`
  margin-top: 1rem;
`

const DownArrowBackground = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  justify-content: center;
  align-items: center;
`

const DownArrow = styled.img`
  width: 0.625rem;
  height: 0.625rem;
  position: relative;
  padding: 0.875rem;
  cursor: ${({ clickable }) => clickable && 'pointer'};
`

const ExchangeRateWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
  color: ${({ theme }) => theme.doveGray};
  font-size: 0.75rem;
  padding: 0.5rem 1rem;
`

const ExchangeRate = styled.span`
  flex: 1 1 auto;
  width: 0;
  color: ${({ theme }) => theme.chaliceGray};
`

const Flex = styled.div`
  display: flex;
  justify-content: center;
  padding: 2rem;

  button {
    max-width: 20rem;
  }
`

function calculateSlippageBounds(value, token = false) {
  if (value) {
    const offset = value.mul(token ? TOKEN_ALLOWED_SLIPPAGE : ALLOWED_SLIPPAGE).div(ethers.utils.bigNumberify(10000))
    const minimum = value.sub(offset)
    const maximum = value.add(offset)
    return {
      minimum: minimum.lt(ethers.constants.Zero) ? ethers.constants.Zero : minimum,
      maximum: maximum.gt(ethers.constants.MaxUint256) ? ethers.constants.MaxUint256 : maximum
    }
  } else {
    return {}
  }
}

function getSwapType(inputCurrency, outputCurrency,ndao_address) {
  if (!inputCurrency || !outputCurrency || !ndao_address) {
    return null
  } else if (inputCurrency === 'ETH') {
      if(outputCurrency.toLowerCase() === ndao_address.toLowerCase()){
          return ETH_TO_NDAO
      }else{
          return ETH_TO_TOKEN
      }
  } else if (inputCurrency.toLowerCase() === ndao_address.toLowerCase()) {
    return NDAO_TO_TOKEN
  } else  if (outputCurrency.toLowerCase() === ndao_address.toLowerCase()){
    return TOKEN_TO_NDAO
  }else{
    return TOKEN_TO_TOKEN
  }
}

// this mocks the getInputPrice function, and calculates the required output
function calculateNdaoTokenOutputFromInput(inputAmount, inputReserve, outputReserve) {
  const numerator = inputAmount.mul(outputReserve)
  const denominator = inputReserve.add(inputAmount)
  return numerator.div(denominator)
}

// this mocks the getOutputPrice function, and calculates the required input
function calculateNdaoTokenInputFromOutput(outputAmount, inputReserve, outputReserve) {
  const numerator = inputReserve.mul(outputAmount)
  const denominator = outputReserve.sub(outputAmount)
  return numerator.div(denominator).add(ethers.constants.One)
}

function getInitialSwapState(outputCurrency) {
  return {
    independentValue: '', // this is a user input
    dependentValue: '', // this is a calculated number
    independentField: INPUT,
    inputCurrency: 'ETH',
    outputCurrency: outputCurrency ? outputCurrency : ''
  }
}

function swapStateReducer(state, action) {
  switch (action.type) {
    case 'FLIP_INDEPENDENT': {
      const { independentField, inputCurrency, outputCurrency } = state
      return {
        ...state,
        dependentValue: '',
        independentField: independentField === INPUT ? OUTPUT : INPUT,
        inputCurrency: outputCurrency,
        outputCurrency: inputCurrency
      }
    }
    case 'SELECT_CURRENCY': {
      const { inputCurrency, outputCurrency } = state
      const { field, currency } = action.payload

      const newInputCurrency = field === INPUT ? currency : inputCurrency
      const newOutputCurrency = field === OUTPUT ? currency : outputCurrency
      if (newInputCurrency === newOutputCurrency) {
        return {
          ...state,
          inputCurrency: field === INPUT ? currency : '',
          outputCurrency: field === OUTPUT ? currency : ''
        }
      } else {
        return {
          ...state,
          inputCurrency: newInputCurrency,
          outputCurrency: newOutputCurrency
        }
      }
    }
    case 'UPDATE_INDEPENDENT': {
      const { field, value } = action.payload
      const { dependentValue, independentValue } = state
      return {
        ...state,
        independentValue: value,
        dependentValue: value === independentValue ? dependentValue : '',
        independentField: field
      }
    }
    case 'UPDATE_DEPENDENT': {
      return {
        ...state,
        dependentValue: action.payload
      }
    }
    default: {
      return getInitialSwapState()
    }
  }
}

function getExchangeRate(inputValue, inputDecimals, outputValue, outputDecimals, invert = false) {
  try {
    if (
      inputValue &&
      (inputDecimals || inputDecimals === 0) &&
      outputValue &&
      (outputDecimals || outputDecimals === 0)
    ) {
      const factor = ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18))

      if (invert) {
        return inputValue
          .mul(factor)
          .div(outputValue)
          .mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(outputDecimals)))
          .div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(inputDecimals)))
      } else {
        return outputValue
          .mul(factor)
          .div(inputValue)
          .mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(inputDecimals)))
          .div(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(outputDecimals)))
      }
    }
  } catch {}
}

function getMarketRate(
  swapType,
  inputReserveNDAO,
  inputReserveToken,
  inputDecimals,
  outputReserveNDAO,
  outputReserveToken,
  outputDecimals,
  invert = false
) {
  if (swapType === NDAO_TO_TOKEN) {
    return getExchangeRate(outputReserveNDAO, 18, outputReserveToken, outputDecimals, invert)
} else if (swapType === TOKEN_TO_NDAO) {
    return getExchangeRate(inputReserveToken, inputDecimals, inputReserveNDAO, 18, invert)
  } else if (swapType === TOKEN_TO_TOKEN) {
    const factor = ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18))
    const firstRate = getExchangeRate(inputReserveToken, inputDecimals, inputReserveNDAO, 18)
    const secondRate = getExchangeRate(outputReserveNDAO, 18, outputReserveToken, outputDecimals)
    try {
      return !!(firstRate && secondRate) ? firstRate.mul(secondRate).div(factor) : undefined
    } catch {}
  }
}

//0-factory 1-inputContract 2-outContract
function getSwapContract(swapType){
    switch (swapType) {
        case ETH_TO_TOKEN:
        case NDAO_TO_TOKEN:
            return 2;
        case ETH_TO_NDAO:
            return 0;
        case TOKEN_TO_NDAO:
        case TOKEN_TO_TOKEN:
        default:
            return 1;
    }
}

export default function Swap({ initialCurrency }) {
  const { t } = useTranslation()
  const { networkId, account } = useWeb3Context()
  const ndao_address = NDAO_ADDRESSES[networkId];
  const addTransaction = useTransactionAdder()
  const ethPrice = useEthPrice();
  // analytics
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])


  // core swap state
  const [swapState, dispatchSwapState] = useReducer(swapStateReducer, initialCurrency, getInitialSwapState)
  const { independentValue, dependentValue, independentField, inputCurrency, outputCurrency } = swapState

  // get swap type from the currency types
  const swapType = getSwapType(inputCurrency, outputCurrency,ndao_address)

  // get decimals and exchange addressfor each of the currency types
  const { symbol: inputSymbol, decimals: inputDecimals, exchangeAddress: inputExchangeAddress,maxPool:inputLimit } = useTokenDetails(
    inputCurrency
  )
  const { symbol: outputSymbol, decimals: outputDecimals, exchangeAddress: outputExchangeAddress} = useTokenDetails(
    outputCurrency
  )
  const inputExchangeContract = useExchangeContract(inputExchangeAddress)
  const outputExchangeContract = useExchangeContract(outputExchangeAddress)
  const factory = useFactoryContract();
  const _type = getSwapContract(swapType);
  const contract = _type === 0 ? factory : (_type === 1 ? inputExchangeContract : outputExchangeContract);
  // get input allowance
  // const inputAllowance = useAddressAllowance(account, inputCurrency, inputExchangeAddress)
  let _address = contract ? contract.address : null;
  if(swapType === NDAO_TO_TOKEN && outputExchangeContract ){
      _address = outputExchangeContract.address;
      setNdaoExchangeAddress(_address);
  }else{
      setNdaoExchangeAddress("");
  }
  const inputAllowance = useAddressAllowance(account, inputCurrency, _address)

  // fetch reserves for each of the currency types
  const { reserveNDAO: inputReserveNDAO, reserveToken: inputReserveToken } = useExchangeReserves(inputCurrency)
  const { reserveNDAO: outputReserveNDAO, reserveToken: outputReserveToken } = useExchangeReserves(outputCurrency)
  // get balances for each of the currency types
  const inputBalance = useAddressBalance(account, inputCurrency,"input")
  const outputBalance = useAddressBalance(account, outputCurrency,"output")
  // const exchangeTokenBalance = useAddressBalance(exchangeAddress, outputCurrency)
  // const exchangeNdaoBalance = useAddressBalance(exchangeAddress, 'NDAO')
  const inputBalanceFormatted = !!(inputBalance && Number.isInteger(inputDecimals))
    ? amountFormatter(inputBalance, inputDecimals, Math.min(4, inputDecimals))
    : ''
  const outputBalanceFormatted = !!(outputBalance && Number.isInteger(outputDecimals))
    ? amountFormatter(outputBalance, outputDecimals, Math.min(4, outputDecimals))
    : ''

  // compute useful transforms of the data above
  const independentDecimals = independentField === INPUT ? inputDecimals : outputDecimals
  const dependentDecimals = independentField === OUTPUT ? inputDecimals : outputDecimals

  // declare/get parsed and formatted versions of input/output values
  const [independentValueParsed, setIndependentValueParsed] = useState()
  const dependentValueFormatted = !!(dependentValue && (dependentDecimals || dependentDecimals === 0))
    ? amountFormatter(dependentValue, dependentDecimals, Math.min(4, dependentDecimals), false)
    : ''
  const inputValueParsed = independentField === INPUT ? independentValueParsed : dependentValue
  const inputValueFormatted = independentField === INPUT ? independentValue : dependentValueFormatted
  const outputValueParsed = independentField === OUTPUT ? independentValueParsed : dependentValue
  const outputValueFormatted = independentField === OUTPUT ? independentValue : dependentValueFormatted
  // validate + parse independent value
  const [independentError, setIndependentError] = useState()
  useEffect(() => {
    if (independentValue && (independentDecimals || independentDecimals === 0)) {
      try {
        const parsedValue = ethers.utils.parseUnits(independentValue, independentDecimals)

        if (parsedValue.lte(ethers.constants.Zero) || parsedValue.gte(ethers.constants.MaxUint256)) {
          throw Error()
        } else {
          setIndependentValueParsed(parsedValue)
          setIndependentError(null)
        }
      } catch {
        setIndependentError(t('inputNotValid'))
      }

      return () => {
        setIndependentValueParsed()
        setIndependentError()
      }
    }
  }, [independentValue, independentDecimals, t])

  useEffect(()=>{

  },[]);


  // calculate slippage from target rate
  const { minimum: dependentValueMinumum, maximum: dependentValueMaximum } = calculateSlippageBounds(
    dependentValue,
    swapType === TOKEN_TO_TOKEN
  )

  // validate input allowance + balance
  //todo 当输入为NDAO时，地址为输出交易对地址
  const [inputError, setInputError] = useState()
  const [showUnlock, setShowUnlock] = useState(false)
  useEffect(() => {
    const inputValueCalculation = independentField === INPUT ? independentValueParsed : dependentValueMaximum
    if (inputBalance && (inputAllowance || inputCurrency === 'ETH') && inputValueCalculation) {
      if (inputBalance.lt(inputValueCalculation)) {
        setInputError(t('insufficientBalance'))
    } else if (inputCurrency !== 'ETH'  && inputAllowance.lt(inputValueCalculation) ) {
        setInputError(t('unlockTokenCont'))
        setShowUnlock(true)
      } else {
        setInputError(null)
        setShowUnlock(false)
      }
      return () => {
        setInputError()
        setShowUnlock(false)
      }
    }
  }, [independentField, independentValueParsed, dependentValueMaximum, inputBalance, inputCurrency, inputAllowance, t])

  // calculate dependent value
  useEffect(() => {
    const amount = independentValueParsed
    if (swapType === ETH_TO_NDAO){
        if(amount && ethPrice){
            try {
                const calculatedDependentValue =
                  independentField === INPUT
                  ? getInputPrice(ethPrice, amount)
                  : getOutputPrice(ethPrice, amount)
                if (calculatedDependentValue.lte(ethers.constants.Zero)) {
                  throw Error()
                }
                dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: calculatedDependentValue })
            } catch(err) {
              setIndependentError(t('insufficientLiquidity'))
            }
            return () => {
              dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: '' })
            }
        }
    }else if (swapType === ETH_TO_TOKEN){
        const reserveNDAO = outputReserveNDAO
        const reserveToken = outputReserveToken
        if(amount && ethPrice  && reserveNDAO && reserveToken){
            try {
                const ndao_amount =  independentField === INPUT
                 ? getInputPrice(ethPrice, amount)
                 : calculateNdaoTokenInputFromOutput(amount, reserveNDAO, reserveToken);
                const calculatedDependentValue =
                  independentField === INPUT
                  ? calculateNdaoTokenOutputFromInput(ndao_amount, reserveNDAO, reserveToken)
                  : getOutputPrice(ethPrice, ndao_amount)
                if (calculatedDependentValue.lte(ethers.constants.Zero)) {
                  throw Error()
                }
                dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: calculatedDependentValue })
            } catch(err) {
              setIndependentError(t('insufficientLiquidity'))
            }
            return () => {
              dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: '' })
            }
        }

    }else if (swapType === NDAO_TO_TOKEN) {
      const reserveNDAO = outputReserveNDAO
      const reserveToken = outputReserveToken
      if (amount && reserveNDAO && reserveToken) {
        try {
          const calculatedDependentValue =
            independentField === INPUT
              ? calculateNdaoTokenOutputFromInput(amount, reserveNDAO, reserveToken)
              : calculateNdaoTokenInputFromOutput(amount, reserveNDAO, reserveToken)

          if (calculatedDependentValue.lte(ethers.constants.Zero)) {
            throw Error()
          }

          dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: calculatedDependentValue })
        } catch {
          setIndependentError(t('insufficientLiquidity'))
        }
        return () => {
          dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: '' })
        }
      }
  } else if (swapType === TOKEN_TO_NDAO) {
      const reserveNDAO = inputReserveNDAO
      const reserveToken = inputReserveToken

      if (amount && reserveNDAO && reserveToken) {
        try {
          const calculatedDependentValue =
            independentField === INPUT
              ? calculateNdaoTokenOutputFromInput(amount, reserveToken, reserveNDAO)
              : calculateNdaoTokenInputFromOutput(amount, reserveToken, reserveNDAO)

          if (calculatedDependentValue.lte(ethers.constants.Zero)) {
            throw Error()
          }

          dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: calculatedDependentValue })
        } catch {
          setIndependentError(t('insufficientLiquidity'))
        }
        return () => {
          dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: '' })
        }
      }
    } else if (swapType === TOKEN_TO_TOKEN) {
      const reserveETHFirst = inputReserveNDAO
      const reserveTokenFirst = inputReserveToken

      const reserveETHSecond = outputReserveNDAO
      const reserveTokenSecond = outputReserveToken

      if (amount && reserveETHFirst && reserveTokenFirst && reserveETHSecond && reserveTokenSecond) {
        try {
          if (independentField === INPUT) {
            const intermediateValue = calculateNdaoTokenOutputFromInput(amount, reserveTokenFirst, reserveETHFirst)
            if (intermediateValue.lte(ethers.constants.Zero)) {
              throw Error()
            }
            const calculatedDependentValue = calculateNdaoTokenOutputFromInput(
              intermediateValue,
              reserveETHSecond,
              reserveTokenSecond
            )
            if (calculatedDependentValue.lte(ethers.constants.Zero)) {
              throw Error()
            }
            dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: calculatedDependentValue })
          } else {
            const intermediateValue = calculateNdaoTokenInputFromOutput(amount, reserveETHSecond, reserveTokenSecond)
            if (intermediateValue.lte(ethers.constants.Zero)) {
              throw Error()
            }
            const calculatedDependentValue = calculateNdaoTokenInputFromOutput(
              intermediateValue,
              reserveTokenFirst,
              reserveETHFirst
            )
            if (calculatedDependentValue.lte(ethers.constants.Zero)) {
              throw Error()
            }
            dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: calculatedDependentValue })
          }
        } catch {
          setIndependentError(t('insufficientLiquidity'))
        }
        return () => {
          dispatchSwapState({ type: 'UPDATE_DEPENDENT', payload: '' })
        }
      }
    }
  }, [
    ethPrice,
    independentValueParsed,
    swapType,
    outputReserveNDAO,
    outputReserveToken,
    inputReserveNDAO,
    inputReserveToken,
    independentField,
    t
  ])

  const [inverted, setInverted] = useState(false)
  const exchangeRate = getExchangeRate(inputValueParsed, inputDecimals, outputValueParsed, outputDecimals)
  const exchangeRateInverted = getExchangeRate(inputValueParsed, inputDecimals, outputValueParsed, outputDecimals, true)

  const marketRate = getMarketRate(
    swapType,
    inputReserveNDAO,
    inputReserveToken,
    inputDecimals,
    outputReserveNDAO,
    outputReserveToken,
    outputDecimals
  )

  const percentSlippage =
    exchangeRate && marketRate
      ? exchangeRate
          .sub(marketRate)
          .abs()
          .mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(18)))
          .div(marketRate)
          .sub(ethers.utils.bigNumberify(3).mul(ethers.utils.bigNumberify(10).pow(ethers.utils.bigNumberify(15))))
      : undefined
  // const percentSlippageFormatted = percentSlippage && amountFormatter(percentSlippage, 16, 2)
  const slippageWarning =
    percentSlippage &&
    percentSlippage.gte(ethers.utils.parseEther('.05')) &&
    percentSlippage.lt(ethers.utils.parseEther('.2')) // [5% - 20%)
  const highSlippageWarning = percentSlippage && percentSlippage.gte(ethers.utils.parseEther('.2')) // [20+%

  const isValid = exchangeRate && inputError === null && independentError === null

  const estimatedText = `(${t('estimated')})`
  function formatBalance(value) {
    return `Balance: ${value}`
  }

  function renderTransactionDetails() {
    ReactGA.event({
      category: 'TransactionDetail',
      action: 'Open'
    })

    const b = text => <BlueSpan>{text}</BlueSpan>
    // const hideMarket = (swapType === ETH_TO_NDAO || swapType === NDAO_TO_ETH);
    if (independentField === INPUT) {
      return (
        <div>
          <div>
            {t('youAreSelling')}{' '}
            {b(
              `${amountFormatter(
                independentValueParsed,
                independentDecimals,
                Math.min(4, independentDecimals)
              )} ${inputSymbol}`
            )}
            .
          </div>
          <LastSummaryText>
            {t('youWillReceive')}{' '}
            {b(
              `${amountFormatter(
                dependentValueMinumum,
                dependentDecimals,
                Math.min(4, dependentDecimals)
              )} ${outputSymbol}`
            )}{' '}
            {t('orTransFail')}
          </LastSummaryText>
          <LastSummaryText>
            {(slippageWarning || highSlippageWarning) && (
              <span role="img" aria-label="warning">
                ⚠️
              </span>
            )}
            {/* {t('priceChange')} {b(`${}%`)}. */}
          </LastSummaryText>
        </div>
      )
    } else {
      return (
        <div>
          <div>
            {t('youAreBuying')}{' '}
            {b(
              `${amountFormatter(
                independentValueParsed,
                independentDecimals,
                Math.min(4, independentDecimals)
              )} ${outputSymbol}`
            )}
            .
          </div>
          <LastSummaryText>
            {t('itWillCost')}{' '}
            {b(
              `${amountFormatter(
                dependentValueMaximum,
                dependentDecimals,
                Math.min(4, dependentDecimals)
              )} ${inputSymbol}`
            )}{' '}
            {t('orTransFail')}
          </LastSummaryText>
          <LastSummaryText>
            {/* {t('priceChange')} {b(`${}%`)}. */}
          </LastSummaryText>
        </div>
      )
    }
  }

  function renderSummary() {
    let contextualInfo = ''
    let isError = false

    if (inputError || independentError) {
      contextualInfo = inputError || independentError
      isError = true
    } else if (!inputCurrency || !outputCurrency) {
      contextualInfo = t('selectTokenCont')
    } else if (!independentValue) {
      contextualInfo = t('enterValueCont')
    } else if (!account) {
      contextualInfo = t('noWallet')
      isError = true
    }

    const slippageWarningText = highSlippageWarning
      ? t('highSlippageWarning')
      : slippageWarning
      ? t('slippageWarning')
      : ''

    return (
      <NewContextualInfo
        openDetailsText={t('transactionDetails')}
        closeDetailsText={t('hideDetails')}
        contextualInfo={contextualInfo ? contextualInfo : slippageWarningText}
        allowExpand={!!(inputCurrency && outputCurrency && inputValueParsed && outputValueParsed)}
        isError={isError}
        slippageWarning={slippageWarning && !contextualInfo}
        highSlippageWarning={highSlippageWarning && !contextualInfo}
        renderTransactionDetails={renderTransactionDetails}
      />
    )
  }

  async function onSwap() {
    const deadline = Math.ceil(Date.now() / 1000) + DEADLINE_FROM_NOW
    let estimate, method, args, value
    if (independentField === INPUT) {
      ReactGA.event({
        category: `${swapType}`,
        action: 'SwapInput'
      })

      if (swapType === ETH_TO_NDAO) {
        estimate = contract.estimate.buyNdaoInputSwap
        method = contract.buyNdaoInputSwap
        args = [dependentValueMinumum, deadline]
        value = independentValueParsed
    } else if (swapType === TOKEN_TO_NDAO) {
        estimate = contract.estimate.tokenToNdaoSwapInput
        method = contract.tokenToNdaoSwapInput
        args = [independentValueParsed, dependentValueMinumum, deadline]
        value = ethers.constants.Zero
      } else if (swapType === TOKEN_TO_TOKEN) {
        estimate = contract.estimate.tokenToTokenSwapInput
        method = contract.tokenToTokenSwapInput
        args = [independentValueParsed, dependentValueMinumum, ethers.constants.One, deadline, outputCurrency]
        value = ethers.constants.Zero
      }else if (swapType === NDAO_TO_TOKEN) {
        estimate = contract.estimate.ndaoToTokenSwapInput
        method = contract.ndaoToTokenSwapInput
        args = [independentValueParsed,dependentValueMinumum, deadline]
        value = ethers.constants.Zero
      }else if(swapType === ETH_TO_TOKEN){
        estimate = contract.estimate.ethToTokenSwapInput
        method = contract.ethToTokenSwapInput
        args = [dependentValueMinumum, deadline]
        value = independentValueParsed
      }
    } else if (independentField === OUTPUT) {
      ReactGA.event({
        category: `${swapType}`,
        action: 'SwapOutput'
      })

      if (swapType === ETH_TO_NDAO) {
        estimate = contract.estimate.buyNdaoOutputSwap
        method = contract.buyNdaoOutputSwap
        args = [independentValueParsed, deadline]
        value = dependentValueMaximum
    } else if (swapType === TOKEN_TO_NDAO) {
        estimate = contract.estimate.tokenToNdaoSwapOutput
        method = contract.tokenToNdaoSwapOutput
        args = [independentValueParsed, dependentValueMaximum, deadline]
        value = ethers.constants.Zero
      } else if (swapType === TOKEN_TO_TOKEN) {
        estimate = contract.estimate.tokenToTokenSwapOutput
        method = contract.tokenToTokenSwapOutput
        args = [independentValueParsed, dependentValueMaximum, ethers.constants.MaxUint256, deadline, outputCurrency]
        value = ethers.constants.Zero
      }else if (swapType === NDAO_TO_TOKEN) {
        estimate = contract.estimate.ndaoToTokenSwapOutput
        method = contract.ndaoToTokenSwapOutput
        args = [independentValueParsed,dependentValueMaximum, deadline]
        value = ethers.constants.Zero
      }else if(swapType === ETH_TO_TOKEN){
        estimate = contract.estimate.ethToTokenSwapOutput
        method = contract.ethToTokenSwapOutput
        args = [independentValueParsed, deadline]
        value = dependentValueMaximum
      }
    }

    const estimatedGasLimit = await estimate(...args, { value })
    method(...args, { value, gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN) }).then(response => {
      addTransaction(response)
    })
  }
  const tokenInputFlag = swapType === TOKEN_TO_NDAO || swapType === TOKEN_TO_TOKEN;
  const tokenOutPutFlag = swapType === ETH_TO_TOKEN || swapType === NDAO_TO_TOKEN;
  return (
    <>
      <CurrencyInputPanel type='input'
        title={t('input')}
        description={inputValueFormatted && independentField === OUTPUT ? estimatedText : ''}
        extraText={inputBalanceFormatted && formatBalance(inputBalanceFormatted)}
        extraTextClickHander={() => {
          if (inputBalance && inputDecimals) {
            const valueToSet = inputCurrency === 'ETH' ? inputBalance.sub(ethers.utils.parseEther('.1')) : inputBalance
            if (valueToSet.gt(ethers.constants.Zero)) {
              dispatchSwapState({
                type: 'UPDATE_INDEPENDENT',
                payload: { value: amountFormatter(valueToSet, inputDecimals, inputDecimals, false), field: INPUT }
              })
            }
          }
        }}
        onCurrencySelected={inputCurrency => {
          dispatchSwapState({ type: 'SELECT_CURRENCY', payload: { currency: inputCurrency, field: INPUT } })
        }}
        onValueChange={inputValue => {
          dispatchSwapState({ type: 'UPDATE_INDEPENDENT', payload: { value: inputValue, field: INPUT } })
        }}
        showUnlock={showUnlock}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={inputCurrency}
        value={inputValueFormatted}
        errorMessage={inputError ? inputError : independentField === INPUT ? independentError : ''}
      />
      <OversizedPanel>
        <DownArrowBackground>
          <DownArrow
            // onClick={() => {
            //   dispatchSwapState({ type: 'FLIP_INDEPENDENT' })
            // }}
            // clickable
            alt="swap"
            src={isValid ? ArrowDownBlue : ArrowDownGrey}
          />
        </DownArrowBackground>
      </OversizedPanel>
      <CurrencyInputPanel type='output'
        title={t('output')}
        description={outputValueFormatted && independentField === INPUT ? estimatedText : ''}
        extraText={outputBalanceFormatted && formatBalance(outputBalanceFormatted)}
        onCurrencySelected={outputCurrency => {
          dispatchSwapState({ type: 'SELECT_CURRENCY', payload: { currency: outputCurrency, field: OUTPUT } })
        }}
        onValueChange={outputValue => {
          dispatchSwapState({ type: 'UPDATE_INDEPENDENT', payload: { value: outputValue, field: OUTPUT } })
        }}
        selectedTokens={[inputCurrency, outputCurrency]}
        selectedTokenAddress={outputCurrency}
        value={outputValueFormatted}
        errorMessage={independentField === OUTPUT ? independentError : ''}
        disableUnlock
      />
      <OversizedPanel hideBottom>
        <ExchangeRateWrapper
          onClick={() => {
            setInverted(inverted => !inverted)
          }}
        >
          <ExchangeRate>{t('exchangeRate')}</ExchangeRate>
          {inverted ? (
            <span>
              {exchangeRate
                ? `1 ${outputSymbol} = ${amountFormatter(exchangeRateInverted, 18, 4, false)} ${inputSymbol}`
                : ' - '}
            </span>
          ) : (
            <span>
              {exchangeRate
                ? `1 ${inputSymbol} = ${amountFormatter(exchangeRate, 18, 4, false)} ${outputSymbol}`
                : ' - '}
            </span>
          )}
        </ExchangeRateWrapper>
        { (tokenInputFlag || tokenOutPutFlag) &&
            <ExchangeRateWrapper>
                <ExchangeRate>{t('currentPoolSize')}</ExchangeRate>
                {tokenInputFlag && <span>
                  {inputReserveNDAO && inputReserveToken
                    ? `${amountFormatter(inputReserveNDAO, 18, 4)} NDAO + ${amountFormatter(
                        inputReserveToken,
                        inputDecimals,
                        Math.min(4, inputDecimals)
                    )} ${inputSymbol}`
                    : ' - '}
                </span>
                }
                {
                    tokenOutPutFlag &&  <span>
                       {outputReserveNDAO && outputReserveToken
                         ? `${amountFormatter(outputReserveNDAO, 18, 4)} NDAO + ${amountFormatter(
                             outputReserveToken,
                             outputDecimals,
                             Math.min(4, outputDecimals)
                           )} ${outputSymbol}`
                         : ' - '}
                     </span>
                }

              </ExchangeRateWrapper>
        }
        {
           tokenInputFlag &&   <ExchangeRateWrapper>
                <ExchangeRate>{t('currentPoolTokenLimit')}</ExchangeRate>
                {
                    inputLimit ? `${amountFormatter(
                        inputLimit,
                        inputDecimals,
                        Math.min(4, inputDecimals)
                      )} ${inputSymbol}`
                    : ' - '
                }
                 </ExchangeRateWrapper>
        }
      </OversizedPanel>
      {renderSummary()}
      <Flex>
        <Button disabled={!isValid} onClick={onSwap} warning={highSlippageWarning}>
          {highSlippageWarning ? t('swapAnyway') : t('swap')}
        </Button>
      </Flex>
    </>
  )
}


function getInputPrice(_price,eth_sold) {
    if(_price) {
        let _priceUsd = _price.mul(100);
        let _ten = ethers.utils.bigNumberify(10);
        let _des = _ten.pow(18);
        _des = _des.mul(eth_sold);
        return _des.div(_priceUsd)
    }else{
        return 0;
    }
}


function getOutputPrice(_price,ndao_buy) {
    if(_price) {
        _price = _price.mul(100).mul(ndao_buy);
        let _ten = ethers.utils.bigNumberify(10);
        let _des = _ten.pow(18);
        let _reslut = _price.div(_des).add(ethers.constants.One);
        return _reslut
        // console.log(_reslut.toString());
        // return .add(ethers.constants.One)
    }else{
        return 0;
    }
}
