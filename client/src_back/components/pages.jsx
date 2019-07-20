import React, { Suspense } from 'react'
import styled from 'styled-components'
// import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'

// import Web3ReactManager from '../components/Web3ReactManager'
import Header from './Header'

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
`


export default function App() {
  return (
    <>
      <Suspense fallback={null}>
        <HeaderWrapper>
          <Header />
        </HeaderWrapper>
      </Suspense>
    </>
  )
}
