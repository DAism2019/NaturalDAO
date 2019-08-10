import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { ethers } from 'ethers'
import { reactLocalStorage } from 'reactjs-localstorage';
import { COOKIE_ID,NDAO_ADDRESSES } from '../constants';
import { useFactoryContract } from '../hooks'

import {
  isAddress,
  // getTokenName,
  // getTokenSymbol,
  // getTokenDecimals,
  // getTokenExchangeAddressFromFactory,
  getTokenDetailFromFactory,
  safeAccess
} from '../utils'

const NAME = 'name'
const SYMBOL = 'symbol'
const DECIMALS = 'decimals'
const EXCHANGE_ADDRESS = 'exchangeAddress'
const MAX_POOL = 'maxPool'

const UPDATE = 'UPDATE'
const UPDATE_MANY = 'UPDATE_MANY'

const ETH = {
  ETH: {
    [NAME]: 'Ethereum',
    [SYMBOL]: 'ETH',
    [DECIMALS]: 18,
    [EXCHANGE_ADDRESS]: null,
    [MAX_POOL]:null
  }
}

let NDAO_INFO = {
    [NAME]: 'NaturalDao',
    [SYMBOL]: 'NDAO',
    [DECIMALS]: 18,
    [EXCHANGE_ADDRESS]: null,
    [MAX_POOL]:null
}

let NDAO = { }

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
      const { networkId, tokenAddress, name, symbol, decimals, exchangeAddress,maxPool } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [tokenAddress]: {
            [NAME]: name,
            [SYMBOL]: symbol,
            [DECIMALS]: decimals,
            [EXCHANGE_ADDRESS]: exchangeAddress,
            [MAX_POOL]:maxPool
          }
        }
      }
    }
    case UPDATE_MANY:{
        const {networkId,infos} = payload;
        return {
          ...state,
          [networkId]: {
            ...(safeAccess(state, [networkId]) || {}),
            ...infos
          }
        }
    }
    default: {
      throw Error(`Unexpected action type in TokensContext reducer: '${type}'.`)
    }
  }
}



//将交易对存于缓存中
async function updateExchange(factory,networkId,updateMany){
    if(factory){
        if (INITIAL_TOKENS_CONTEXT.tokenCount === undefined)
            INITIAL_TOKENS_CONTEXT.tokenCount = 0;
        let tokenCount = await factory.tokenCount()
        tokenCount = + tokenCount;
        let noChange = tokenCount === INITIAL_TOKENS_CONTEXT.tokenCount;
        if (noChange)
            return;
        let allPromise = [];
        if(INITIAL_TOKENS_CONTEXT.tokenCount < tokenCount){
            for(let i=INITIAL_TOKENS_CONTEXT.tokenCount+1;i<=tokenCount;i++){
                 allPromise.push(factory.getTokenDetailById(i).catch(() => null))
            }
        }
        Promise.all(allPromise).then(result =>{
            let allInfos = {};
            for(let _result of result){
                let _tokenAddress = _result[0];
                let _name = _result[1];
                let _symbol = _result[2];
                let _decimals =  + _result[3];
                let _exchangeAddress = _result[4];
                let _maxPool = _result[5]
                allInfos[_tokenAddress] = {
                    [NAME]: _name,
                    [SYMBOL]: _symbol,
                    [DECIMALS]: _decimals,
                    [EXCHANGE_ADDRESS]: _exchangeAddress,
                    [MAX_POOL]:_maxPool
                }
            }
            INITIAL_TOKENS_CONTEXT.tokenCount = tokenCount;
            INITIAL_TOKENS_CONTEXT = {
                ...INITIAL_TOKENS_CONTEXT,
                [networkId]: {
                  ...(safeAccess(INITIAL_TOKENS_CONTEXT, [networkId]) || {}),
                  ...allInfos
                }
            }
            reactLocalStorage.setObject(COOKIE_ID,INITIAL_TOKENS_CONTEXT);
            updateMany(networkId,allInfos);
        });
    }
    return true
}


export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_TOKENS_CONTEXT)
  const { networkId } = useWeb3Context()
  let _ndaoAddress = NDAO_ADDRESSES[networkId];
  NDAO = {
      [_ndaoAddress]:NDAO_INFO
  }
  const factory = useFactoryContract();
  const update = useCallback((networkId, tokenAddress, name, symbol, decimals, exchangeAddress, maxPool) => {
    dispatch({ type: UPDATE, payload: { networkId, tokenAddress, name, symbol, decimals, exchangeAddress, maxPool } })
  }, [])
  const updateMany = useCallback((networkId,infos) =>{
    dispatch({type:UPDATE_MANY,payload:{networkId,infos}})
  },[])
  updateExchange(factory,networkId,updateMany)
  useEffect (()=>{
      if(factory){
          factory.on("NewExchange",(_token,_exchange,_amount,_tokenAmount,event) =>{
              updateExchange(factory,networkId,updateMany)
          })
      }
      return ()=>{
          if(factory){
               factory.removeAllListeners("NewExchange")
          }

      }
  },[factory,networkId,updateMany])

  return (
    <TokensContext.Provider value={useMemo(() => [state, { update,updateMany}], [state, update,updateMany])}>
      {children}
    </TokensContext.Provider>
  )
}


//用来设置每个不同交易对时ndao的信息，为了方便统一计算
export function setNdaoExchangeAddress(_address){
    NDAO_INFO[EXCHANGE_ADDRESS] = _address
}


export function useTokenDetails(tokenAddress) {
  const { networkId, library } = useWeb3Context()
  const [state, { update }] = useTokensContext()
  const allTokensInNetwork = { ...ETH, ...NDAO,...(safeAccess(state, [networkId]) || {}) }
  const { [NAME]: name, [SYMBOL]: symbol, [DECIMALS]: decimals, [EXCHANGE_ADDRESS]: exchangeAddress,[MAX_POOL]:maxPool } =
    safeAccess(allTokensInNetwork, [tokenAddress]) || {}
  useEffect(() => {
    if (
      isAddress(tokenAddress) &&
      (name === undefined || symbol === undefined || decimals === undefined || exchangeAddress === undefined) &&
      (networkId || networkId === 0) &&
      library
    ) {

      let stale = false
      getTokenDetailFromFactory(tokenAddress, networkId, library).then( _result =>{
          if (!stale){
              //这里为了保持统一，仍然返回了tokenAddress，虽然没有什么意义
              // let _tokenAddress = _result[0];
              let resolvedName = _result[1];
              let resolvedSymbol = _result[2];
              let resolvedDecimals =  + _result[3];
              let resolvedExchangeAddress = _result[4];
              let maxPool = _result[5]
              update(networkId, tokenAddress, resolvedName, resolvedSymbol, resolvedDecimals, resolvedExchangeAddress,maxPool)
          }
      }).catch(()=>null);
      return () => {
        stale = true
      }
    }
  }, [tokenAddress, name, symbol, decimals, exchangeAddress,maxPool, networkId, library, update])
  //注意:读取缓存后这里的bigNumber被转成16进制，所以要转回去,如果本身是更新得到的，不影响
  let _maxPool = maxPool ? ethers.utils.bigNumberify(maxPool) : null
  return { name, symbol, decimals, exchangeAddress,maxPool:_maxPool }
}


//区分是input还是output，因为output不包含ETH
export function useAllTokenDetails(type,requireExchange = true) {
  const { networkId } = useWeb3Context()
  const [state] = useTokensContext()
  const _solid = type ==='input' ? {...ETH,...NDAO } : {...NDAO};
  const tokenDetails = { ..._solid, ...(safeAccess(state, [networkId]) || {}) }
  return requireExchange
    ? Object.keys(tokenDetails)
        .filter(
          tokenAddress =>
            tokenAddress === 'ETH' || tokenAddress === NDAO_ADDRESSES[networkId] ||
            (safeAccess(tokenDetails, [tokenAddress, EXCHANGE_ADDRESS]) &&
              safeAccess(tokenDetails, [tokenAddress, EXCHANGE_ADDRESS]) !== ethers.constants.AddressZero)
        )
        .reduce((accumulator, tokenAddress) => {
          accumulator[tokenAddress] = tokenDetails[tokenAddress]
          return accumulator
        }, {})
    : tokenDetails
}
