import React, { Suspense, lazy } from 'react'
import styled from 'styled-components'
import logo  from '../assets/images/logo1.svg'
import favicon from "../assets/images/favicon.svg"
import ReactSVG from 'react-svg'
import { Link } from '../theme'
import Web3Status from './Web3Status'
import { darken } from 'polished'

const HeaderElement = styled.div`
  margin: 1.25rem;
  display: flex;
  min-width: 0;
`

const Title = styled.div`
  display: flex;
  align-items: center;

  #image {
    font-size: 1.5rem;
    margin-right: 1rem;
  }

  #link {
    text-decoration-color: ${({ theme }) => theme.wisteriaPurple};
  }

  #title {
    display: inline;
    font-size: 1rem;
    font-weight: 500;
    color: ${({ theme }) => theme.wisteriaPurple};
    :hover {
      color: ${({ theme }) => darken(0.2, theme.wisteriaPurple)};
    }
  }
`

export default function Header() {
  return (
    <>
      <HeaderElement>
        <Title>
          <span id="image" role="img" aria-label="Unicorn Emoji">
            {/* <ReactSVG src={favicon} style={{width:100}}/> */}
            <ReactSVG src={logo} style={{width:200}}/>
          </span>

          <Link id="link" href="https://NaturalDAO.io">
            <h1 id="title">NaturalDAO</h1>
          </Link>
        </Title>
      </HeaderElement>

      <HeaderElement>
        <Web3Status />
      </HeaderElement>
    </>
  )
}
