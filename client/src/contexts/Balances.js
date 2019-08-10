import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import { useExchangeContract } from "../hooks"
import { safeAccess, isAddress, getEtherBalance, getTokenBalance } from '../utils'
import { useBlockNumber } from './Application'
import { useTokenDetails } from './Tokens'
import { NDAO_ADDRESSES } from '../constants'

const UPDATE = 'UPDATE'

const BalancesContext = createContext()

function useBalancesContext() {
  return useContext(BalancesContext)
}

function reducer(state, { type, payload }) {
  switch (type) {
    case UPDATE: {
      const { networkId, address, tokenAddress, value, blockNumber } = payload
      return {
        ...state,
        [networkId]: {
          ...(safeAccess(state, [networkId]) || {}),
          [address]: {
            ...(safeAccess(state, [networkId, address]) || {}),
            [tokenAddress]: {
              value,
              blockNumber
            }
          }
        }
      }
    }
    default: {
      throw Error(`Unexpected action type in BalancesContext reducer: '${type}'.`)
    }
  }
}

export default function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, {})
  const update = useCallback((networkId, address, tokenAddress, value, blockNumber) => {
    dispatch({ type: UPDATE, payload: { networkId, address, tokenAddress, value, blockNumber } })
  }, [])

  return (
    <BalancesContext.Provider value={useMemo(() => [state, { update }], [state, update])}>
      {children}
    </BalancesContext.Provider>
  )
}



export function useAddressBalance(address, tokenAddress,type) {
  const { networkId, library } = useWeb3Context()

  const globalBlockNumber = useBlockNumber()

  const [state, { update }] = useBalancesContext()
  const { value, blockNumber } = safeAccess(state, [networkId, address, tokenAddress]) || {}
  useEffect(() => {
    if (
      isAddress(address) &&
      (tokenAddress === 'ETH' || isAddress(tokenAddress)) &&
      (value === undefined || blockNumber !== globalBlockNumber) &&
      (networkId || networkId === 0) &&
      library
    ) {
      let stale = false;
      (tokenAddress === 'ETH' ? getEtherBalance(address, library) : getTokenBalance(tokenAddress, address, library))
        .then(value => {
          if (!stale) {
            update(networkId, address, tokenAddress, value, globalBlockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            update(networkId, address, tokenAddress, null, globalBlockNumber)
          }
        })

      return () => {
        stale = true
      }
    }
  }, [address, tokenAddress, value, blockNumber, globalBlockNumber, networkId, library, update])

  return value
}

//获得某个交易对里的ndao数量
export function useAddressNdao(exchangeAddress) {
  const { networkId, library } = useWeb3Context()
  const exchangeContract = useExchangeContract(exchangeAddress)
  const globalBlockNumber = useBlockNumber()
  const [state, { update }] = useBalancesContext()
  const ndao_address = NDAO_ADDRESSES[networkId];
  const { value, blockNumber } = safeAccess(state, [networkId, exchangeAddress, ndao_address]) || {}
  useEffect(() => {
    if (isAddress(exchangeAddress) &&
      (value === undefined || blockNumber !== globalBlockNumber) &&
      (networkId || networkId === 0) &&
      library
    ) {
      let stale = false;
      exchangeContract.getNdaoReserve().then(value => {
          if (!stale) {
            update(networkId, exchangeAddress, ndao_address, value, globalBlockNumber)
          }
        })
        .catch(() => {
          if (!stale) {
            update(networkId, exchangeAddress, ndao_address, null, globalBlockNumber)
          }
        })

      return () => {
        stale = true
      }
    }
  }, [exchangeAddress, ndao_address, value, blockNumber, globalBlockNumber, networkId, library, update,exchangeContract])

  return value
}


//这里要改成ndao的数量
export function useExchangeReserves(tokenAddress){
    const { exchangeAddress } = useTokenDetails(tokenAddress);
    const reserveNDAO = useAddressNdao(exchangeAddress);
    const reserveToken = useAddressBalance(exchangeAddress, tokenAddress)
    return { reserveNDAO, reserveToken }
}


export function useTokenLimit(tokenAddress)  {
    const { maxPool } = useTokenDetails(tokenAddress);
    return maxPool;
}

// export function useExchangeReserves(tokenAddress) {
//   const { exchangeAddress } = useTokenDetails(tokenAddress)
//   const reserveETH = useAddressBalance(exchangeAddress, 'ETH')
//   const reserveToken = useAddressBalance(exchangeAddress, tokenAddress)
//   return { reserveETH, reserveToken }
// }
