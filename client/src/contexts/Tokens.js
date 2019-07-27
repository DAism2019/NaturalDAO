import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'
import { reactLocalStorage } from 'reactjs-localstorage';
import { COOKIE_ID } from '../constants';
import { useFactoryContract } from '../hooks'

import {
  isAddress,
  getTokenName,
  getTokenSymbol,
  getTokenDecimals,
  getTokenExchangeAddressFromFactory,
  safeAccess
} from '../utils'

const NAME = 'name'
const SYMBOL = 'symbol'
const DECIMALS = 'decimals'
const EXCHANGE_ADDRESS = 'exchangeAddress'

const UPDATE = 'UPDATE'

const ETH = {
  ETH: {
    [NAME]: 'Ethereum',
    [SYMBOL]: 'ETH',
    [DECIMALS]: 18,
    [EXCHANGE_ADDRESS]: null
  }
}

const NDAO = {
    NDAO:{
        [NAME]: 'NaturalDao',
        [SYMBOL]: 'NDAO',
        [DECIMALS]: 18,
        [EXCHANGE_ADDRESS]: {
            1:"",
            5777:"0x7fe484b457c2d55B1878ea1Ce7e51d84D72a48c9"
        }
    }
}



function init_token(){
    return reactLocalStorage.getObject(COOKIE_ID)
}

let INITIAL_TOKENS_CONTEXT = init_token();

// let INITIAL_TOKENS_CONTEXT = {
//   1: {
//     '0x960b236A07cf122663c4303350609A66A7B288C0': {
//       [NAME]: 'Aragon Network Token',
//       [SYMBOL]: 'ANT',
//       [DECIMALS]: 18,
//       [EXCHANGE_ADDRESS]: '0x077d52B047735976dfdA76feF74d4d988AC25196'
//     }
//   }
// }

const TokensContext = createContext()

function useTokensContext() {
  return useContext(TokensContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, tokenAddress, name, symbol, decimals, exchangeAddress } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [tokenAddress]: {
            [NAME]: name,
            [SYMBOL]: symbol,
            [DECIMALS]: decimals,
            [EXCHANGE_ADDRESS]: exchangeAddress
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in TokensContext reducer: '${type}'.`)
    }
  }
}

//将交易对存于缓存中
async function updateExchange(factory,networkId){
    console.log("updateExchange")
    if(factory){
        // let infos = reactLocalStorage.getObject(COOKIE_ID);
        if (INITIAL_TOKENS_CONTEXT.tokenCount == undefined)
            INITIAL_TOKENS_CONTEXT.tokenCount = 0;
        let tokenCount = await factory.tokenCount()
        tokenCount = + tokenCount;
        let allPromise = [];
        if(INITIAL_TOKENS_CONTEXT.tokenCount < tokenCount){
            for(let i=INITIAL_TOKENS_CONTEXT.tokenCount+1;i<=tokenCount;i++){
                let _result = await factory.getTokenDetailById(i);
                console.log(_result);  
            }

            // allPromise.push(factory.getTokenDetailById(i).catch(() => null))
        }
        // Promise.all(allPromise).then(result =>{
        //     INITIAL_TOKENS_CONTEXT.tokenCount = tokenCount;
        //     if(!INITIAL_TOKENS_CONTEXT[networkId])
        //         INITIAL_TOKENS_CONTEXT[networkId] ={}
        //     for(let _result of result){
        //         console.log(_result)
        //     }
        // });
    }
    return true
}


export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_TOKENS_CONTEXT)
  const { networkId } = useWeb3Context()
  const factory = useFactoryContract();
  updateExchange(factory,networkId)
  const update = useCallback((networkId, tokenAddress, name, symbol, decimals, exchangeAddress) => {
    dispatch({ type: UPDATE, payload: { networkId, tokenAddress, name, symbol, decimals, exchangeAddress } })
  }, [])

  return (
    <TokensContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </TokensContext.Provider>
  )
}

export function useTokenDetails(tokenAddress) {
  const { networkId, library } = useWeb3Context()

  const [state, { update }] = useTokensContext()
  const allTokensInNetwork = { ...ETH, ...(safeAccess(state, [networkId]) || {}) }
  const { [NAME]: name, [SYMBOL]: symbol, [DECIMALS]: decimals, [EXCHANGE_ADDRESS]: exchangeAddress } =
    safeAccess(allTokensInNetwork, [tokenAddress]) || {}

  useEffect(() => {
    if (
      isAddress(tokenAddress) &&
      (name === undefined || symbol === undefined || decimals === undefined || exchangeAddress === undefined) &&
      (networkId || networkId === 0) &&
      library
    ) {
      let stale = false

      const namePromise = getTokenName(tokenAddress, library).catch(() => null)
      const symbolPromise = getTokenSymbol(tokenAddress, library).catch(() => null)
      const decimalsPromise = getTokenDecimals(tokenAddress, library).catch(() => null)
      const exchangeAddressPromise = getTokenExchangeAddressFromFactory(tokenAddress, networkId, library).catch(
        () => null
      )

      Promise.all([namePromise, symbolPromise, decimalsPromise, exchangeAddressPromise]).then(
        ([resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress]) => {
          if (!stale) {
            update(networkId, tokenAddress, resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress)
          }
        }
      )

      return () => {
        stale = true
      }
    }
  }, [tokenAddress, name, symbol, decimals, exchangeAddress, networkId, library, update])

  return { name, symbol, decimals, exchangeAddress }
}

export function useAllTokenDetails(requireExchange = true) {
  const { networkId } = useWeb3Context()

  const [state] = useTokensContext()
  const tokenDetails = { ...ETH, ...(safeAccess(state, [networkId]) || {}) }

  return requireExchange
    ? Object.keys(tokenDetails)
        .filter(
          tokenAddress =>
            tokenAddress === 'ETH' ||
            (safeAccess(tokenDetails, [tokenAddress, EXCHANGE_ADDRESS]) &&
              safeAccess(tokenDetails, [tokenAddress, EXCHANGE_ADDRESS]) !== ethers.constants.AddressZero)
        )
        .reduce((accumulator, tokenAddress) => {
          accumulator[tokenAddress] = tokenDetails[tokenAddress]
          return accumulator
        }, {})
    : tokenDetails
}
