import React from 'react'
import styled from 'styled-components'
import ReactSVG from 'react-svg'
import { Link } from '../../theme'
import Web3Status from '../Web3Status'
import { darken } from 'polished'
import logo from "../../assets/images/logo1.svg"
// import logo from "../../assets/images/natualDao.svg"

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
          <span id="image" role="img" aria-label="Unicorn Emoji" style={{marginTop:-10}}>
            {/* 🦄 */}
         <Link id="link" href="https://naturaldao.io">   <ReactSVG src={logo} style={{width:100}}/>
           </Link>
          </span>

          {/* <Link id="link" href="https://naturaldao.io">
            <h1 id="title">NaturalDAO</h1>
          </Link> */}
        </Title>
      </HeaderElement>

      <HeaderElement>
        <Web3Status />
      </HeaderElement>
    </>
  )
}
