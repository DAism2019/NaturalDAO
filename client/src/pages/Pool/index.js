import React, { Suspense, lazy, useEffect } from 'react'
import ReactGA from 'react-ga'
import { Switch, Route, Redirect } from 'react-router-dom'
import { isAddress } from '../../utils'
import ModeSelector from './ModeSelector'

// const AddLiquidity = lazy(() => import('./AddLiquidity'))
// const RemoveLiquidity = lazy(() => import('./RemoveLiquidity'))
// const CreateExchange = lazy(() => import('./CreateExchange'))
const IcoDetail = lazy(() => import('./IcoDetail'))
const CreateIco = lazy(() => import('./CreateIco'))
const QueryIco = lazy(() => import('./QueryIco'))

export default function Pool() {
  useEffect(() => {
    ReactGA.pageview(window.location.pathname + window.location.search)
  }, [])

  return (
    <>
      <ModeSelector />
      {/* this Suspense is for route code-splitting */}
      <Suspense fallback={null}>
        <Switch>
          <Route exact strict path="/query-ico" component={QueryIco} />
          <Route exact strict path="/ico-detail" component={IcoDetail} />
          <Route exact strict path="/create-ico" component={CreateIco} />
          <Route
                    exact
                      strict
                      path="/ico-detail#tokenAddress?"
                      render={({ match }) => {
                        if (isAddress(match.params.tokenAddress)) {
                          return <IcoDetail icoAddress={match.params.tokenAddress} />
                        } else {
                          return <Redirect to={{ pathname: '/ico-detail' }} />
                        }
                      }}
                    />
          {/* <Route
            path="/ico-detail/:tokenAddress"
            render={({ match }) => {
              return (
                <Redirect to={{ pathname: '/create-exchange', state: { tokenAddress: match.params.tokenAddress } }} />
              )
            }} */}
          />
          <Redirect to="/create-ico" />
        </Switch>
      </Suspense>
    </>
  )
}
