import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect} from 'react'
import { useWeb3Context } from 'web3-react'
import { usePriceContract } from '../hooks'
import { getMyPriceContract } from '../utils'

const UPDATE = 'UPDATE'
const PriceContext = createContext()

function usePriceContext() {
  return useContext(PriceContext)
}

function reducer(state, { type, payload }){
    switch (type) {
        case UPDATE:{
            const { price } = payload;
            return {
                ...state,
                price
            }
           break;
        }
        default:{
            throw Error(`Unexpected action type in PriceContext reducer: '${type}'.`)
        }
    }
}


async function updatePrice(priceContract,update) {
    let _priceCur = await priceContract.getEthPrice();
    update(_priceCur);
}

export default function Provider({ children }) {
    const [state, dispatch] = useReducer(reducer);
    const priceContract = usePriceContract();
    const update = useCallback( price => {
        dispatch({ type: UPDATE, payload: { price }})
     }, []);
    return (
        <PriceContext.Provider value ={useMemo (() => [state,update],[state,update])}>
            {children}
        </PriceContext.Provider>
    )
}




//the ETH price monitor
export function Updater(){
    const priceContract = usePriceContract();
    const { account,library } = useWeb3Context();
    const [,update] = usePriceContext();
    updatePrice(priceContract,update);
    useEffect(() => {
        let _priceContract;
        async function listenPrice(){
            let  _priceAddress = await priceContract.fiator();
            _priceContract = getMyPriceContract(_priceAddress,library,account);
            _priceContract.on('SetEthPrice',async (_from,_to,event) => {
                let _price = await priceContract.getEthPrice();
                update(_price);
            });
        }
        listenPrice();
        return () => {
            if(_priceContract){
                _priceContract.removeAllListeners("SetEthPrice");
            }
        }
    },priceContract,account,library);
    return null;
}
