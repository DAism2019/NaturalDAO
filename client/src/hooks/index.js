import { useState, useMemo, useCallback, useEffect } from 'react'
import { useWeb3Context } from 'web3-react'
import ERC20_ABI from '../constants/abis/erc20'
import TEST_ABI  from '../constants/abis/buyNdaoTest.json'
import { getContract, getFactoryContract, getExchangeContract, getNdaoContract,
        getPriceContract, getMyPriceContract, isAddress } from '../utils'
import copy from 'copy-to-clipboard'

// modified from https://usehooks.com/useDebounce/
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Cancel the timeout if value changes (also on delay change or unmount)
    // This is how we prevent debounced value from updating if value is changed ...
    // .. within the delay period. Timeout gets cleared and restarted.
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// modified from https://usehooks.com/useKeyPress/
export function useBodyKeyDown(targetKey, onKeyDown, suppressOnKeyDown = false) {
  const downHandler = useCallback(
    event => {
      const {
        target: { tagName },
        key
      } = event
      if (key === targetKey && tagName === 'BODY' && !suppressOnKeyDown) {
        event.preventDefault()
        onKeyDown()
      }
    },
    [targetKey, onKeyDown, suppressOnKeyDown]
  )

  useEffect(() => {
    window.addEventListener('keydown', downHandler)
    return () => {
      window.removeEventListener('keydown', downHandler)
    }
  }, [downHandler])
}

export function useENSName(address) {
  const { library } = useWeb3Context()

  const [ENSName, setENSNname] = useState()

  useEffect(() => {
    if (isAddress(address)) {
      let stale = false
      library
        .lookupAddress(address)
        .then(name => {
          if (!stale) {
            if (name) {
              setENSNname(name)
            } else {
              setENSNname(null)
            }
          }
        })
        .catch(() => {
          if (!stale) {
            setENSNname(null)
          }
        })

      return () => {
        stale = true
        setENSNname()
      }
    }
  }, [library, address])

  return ENSName
}

// returns null on errors
export function useContract(address, ABI, withSignerIfPossible = true) {
  const { library, account } = useWeb3Context()

  return useMemo(() => {
    try {
      return getContract(address, ABI, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

const test_address = '0x87C1E0716cFc7C385E4E308c3Da0623B9B452046'
export function useTestContract(withSignerIfPossible = true){
    const { library, account } = useWeb3Context()

    return useMemo(() => {
      try {
        return getContract(test_address, TEST_ABI, library, withSignerIfPossible ? account : undefined)
      } catch {
        return null
      }
    }, [test_address, library, withSignerIfPossible, account])
}

// returns null on errors
export function useTokenContract(tokenAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3Context()

  return useMemo(() => {
    try {
      return getContract(tokenAddress, ERC20_ABI, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [tokenAddress, library, withSignerIfPossible, account])
}

export function usePriceContract(withSignerIfPossible = true) {
  const { networkId, library, account } = useWeb3Context()

  return useMemo(() => {
    try {
      return getPriceContract(networkId, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [networkId, library, withSignerIfPossible, account])
}

export function useMyPriceContract(address,withSignerIfPossible = true){
    const { library, account } = useWeb3Context()

    return useMemo(async () => {
      try {
        return await getMyPriceContract(address, library, withSignerIfPossible ? account : undefined)
      } catch {
        return null
      }
    }, [address, library, withSignerIfPossible, account])
}


export function useNdaoContract(withSignerIfPossible = true) {
  const { networkId, library, account } = useWeb3Context()

  return useMemo(async () => {
    try {
      return await getNdaoContract(networkId, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [networkId, library, withSignerIfPossible, account])
}


// returns null on errors
export function useFactoryContract(withSignerIfPossible = true) {
  const { networkId, library, account } = useWeb3Context()

  return useMemo(() => {
    try {
      return getFactoryContract(networkId, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [networkId, library, withSignerIfPossible, account])
}


export function useExchangeContract(exchangeAddress, withSignerIfPossible = true) {
  const { library, account } = useWeb3Context()

  return useMemo(() => {
    try {
      return getExchangeContract(exchangeAddress, library, withSignerIfPossible ? account : undefined)
    } catch {
      return null
    }
  }, [exchangeAddress, library, withSignerIfPossible, account])
}

export function useCopyClipboard(timeout = 500) {
  const [isCopied, setIsCopied] = useState(false)

  const staticCopy = useCallback(text => {
    const didCopy = copy(text)
    setIsCopied(didCopy)
  }, [])

  useEffect(() => {
    if (isCopied) {
      const hide = setTimeout(() => {
        setIsCopied(false)
      }, timeout)

      return () => {
        clearTimeout(hide)
      }
    }
  }, [isCopied, setIsCopied, timeout])

  return [isCopied, staticCopy]
}
