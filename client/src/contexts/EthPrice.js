import React, { createContext, useContext, useReducer, useMemo, useCallback, useEffect} from 'react'
import { useWeb3Context } from 'web3-react'
import signal from 'signal-js';
import { usePriceContract } from '../hooks'
import { getMyPriceContract,safeAccess } from '../utils'


const UPDATE = 'UPDATE'
const PriceContext = createContext()

export function usePriceContext() {
  return useContext(PriceContext)
}

function reducer(state, { type, payload }){
    switch (type) {
        case UPDATE:{
            return payload;
        }
        default:{
            throw Error(`Unexpected action type in PriceContext reducer: '${type}'.`)
        }
    }
}

async function updatePrice(priceContract,state,update) {
    if(priceContract){
        try{
           let _price = await priceContract.getEthPrice();
           if(!state || !state.price || !state.price.eq(_price)){
               update(_price);
           }
       }catch {

       }
    }
}

export default function Provider({ children }) {
    const [state, dispatch] = useReducer(reducer,{});
    const priceContract = usePriceContract();
    const update = useCallback( price => {
        dispatch({ type: UPDATE, payload: { price }})
     }, []);
    updatePrice(priceContract,state,update)
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
    useEffect(() => {
        let _priceContract;
        async function listenPrice(){
            let  _priceAddress = await priceContract.fiator();
            _priceContract = getMyPriceContract(_priceAddress,library,account);
            _priceContract.on('SetEthPrice',async (_from,_to,event) => {
                let _price = await priceContract.getEthPrice();
                update(_price);
                // signal.emit('updatePrice',_from,_price);
            });
        }
        if(priceContract){
           listenPrice();
        }
        return () => {
            if(_priceContract){
                _priceContract.removeAllListeners("SetEthPrice");
            }
        }
    },[priceContract,account,library,update]);
    return null;
}

export function useEthPrice(){
    const [state,] = usePriceContext();
    const value = safeAccess(state,["price"]);
    return value;
}
