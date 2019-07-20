import React, {useEffect} from 'react'
import ReactDOM from 'react-dom'
import ReactGA from 'react-ga'
import Web3Provider, {Connectors, useWeb3Context} from 'web3-react'
import { BrowserRouter, Route, Redirect, Switch } from "react-router-dom"
import ThemeProvider, {GlobalStyle} from './theme'
// import ApplicationContextProvider, { Updater as ApplicationContextUpdater } from './contexts/Application'
// import TransactionContextProvider, { Updater as TransactionContextUpdater } from './contexts/Transactions'
// import TokensContextProvider from './contexts/Tokens'
// import BalancesContextProvider from './contexts/Balances'
// import AllowancesContextProvider from './contexts/Allowances'
import Pages from "./components/pages.jsx"
import NavigationTabs from './components/NavigationTabs.jsx'
import InjectedConnector from './InjectedConnector'
import './i18n'

if (process.env.NODE_ENV === 'production') {
    ReactGA.initialize('UA-128182339-1')
} else {
    ReactGA.initialize('test', {testMode: true})
}
ReactGA.pageview(window.location.pathname + window.location.search)
const {NetworkOnlyConnector} = Connectors
const Injected = new InjectedConnector({
    supportedNetworks: [Number(process.env.REACT_APP_NETWORK_ID || '1')]
})
const Network = new NetworkOnlyConnector({
    providerURL: process.env.REACT_APP_NETWORK_URL || ''
})
const connectors = {
    Injected,
    Network
}

const Profile = () => <div>You're on the Swap Tab</div>;
const Comments = () => <div>You're on the Send Tab</div>;
const Contact = () => <div>You're on the Ico Tab</div>;



function MyComponent() {
    const context = useWeb3Context()
    // useEffect(() => {
    //     context.setFirstValidConnector(['Injected', 'Infura'])
    // }, [])

    if (!context.active && !context.error) {
        // loading
        return <h1>loading</h1>
    } else if (context.error) {
        //error
        return <h1>error</h1>
    } else {
        // success
        return <h1>{context.account}</h1>
    }
}

// function ContextProviders({ children }) {
//   return (
//     <ApplicationContextProvider>
//       <TransactionContextProvider>
//         <TokensContextProvider>
//           <BalancesContextProvider>
//             <AllowancesContextProvider>{children}</AllowancesContextProvider>
//           </BalancesContextProvider>
//         </TokensContextProvider>
//       </TransactionContextProvider>
//     </ApplicationContextProvider>
//   )
// }

// function Updaters() {
//   return (
//     <>
//       <ApplicationContextUpdater />
//       <TransactionContextUpdater />
//     </>
//   )
// }

ReactDOM.render(
    <ThemeProvider>
    <> <GlobalStyle/>
    <Web3Provider connectors={connectors} libraryName="ethers.js">
        <MyComponent />
    <Pages />

        {/* <ContextProviders> */}

      {/* <Updaters />
          <App /> */
        }
        {/* </ContextProviders> */}
        <BrowserRouter>
            <NavigationTabs />
            <Switch>
              <Route path="/" exact component={Profile} />
              <Route path="/swap" exact component={Profile} />
              <Route path="/comments" component={Comments} />
              <Route path="/contact" component={Contact} />
            </Switch>
        </BrowserRouter>
    </Web3Provider>
</>
</ThemeProvider>, document.getElementById('root'))
