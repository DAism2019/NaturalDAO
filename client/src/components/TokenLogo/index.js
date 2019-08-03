import React, {  useRef, useEffect } from 'react'
import styled from 'styled-components'
import Jazzicon from 'jazzicon'
import { useWeb3Context } from 'web3-react'
import { ReactComponent as EthereumLogo } from '../../assets/images/ethereum-logo.svg'
import { ReactComponent as NaturalDaoLogo } from '../../assets/images/natualDao.svg'
import { NDAO_ADDRESSES } from '../../constants'

// const TOKEN_ICON_API = 'https://raw.githubusercontent.com/TrustWallet/tokens/master/tokens'
// const BAD_IMAGES = {}

// const Image = styled.img`
//   width: ${({ size }) => size};
//   height: ${({ size }) => size};
//   border-radius: 1rem;
// `

const Emoji = styled.span`
  width: ${({ size }) => size};
  font-size: ${({ size }) => size};
`

const StyledEthereumLogo = styled(EthereumLogo)`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

const StyledNaturalDAOLogo = styled(NaturalDaoLogo)`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

export default function TokenLogo({ address, size = '1rem', ...rest }) {
  // const [error, setError] = useState(false)
  const {networkId} = useWeb3Context();
  const ref = useRef()
  useEffect(() => {
      if(address!=='ETH' && address !=='NDAO'){
          if (ref.current) {
            ref.current.innerHTML = ''
            if (address) {
              ref.current.appendChild(Jazzicon(16, parseInt(address.slice(2, 10), 16)))
            }
          }
      }

  },[address]);

  // let path = ''
  if (address === 'ETH') {
    return <StyledEthereumLogo size={size} />
  } else if (address === NDAO_ADDRESSES[networkId]){
    return <StyledNaturalDAOLogo size={size} />
  // } else if (!error && !BAD_IMAGES[address]) {
  //   path = `${TOKEN_ICON_API}/${address.toLowerCase()}.png`
  } else {
    return (
      <Emoji {...rest} ref={ref}>
        {/* <span role="img" aria-label="Thinking">

        </span> */}
      </Emoji>
    )
  }

  // return (
  //   <Image
  //     {...rest}
  //     alt={address}
  //     src={path}
  //     size={size}
  //     onError={() => {
  //       BAD_IMAGES[address] = true
  //       setError(true)
  //     }}
  //   />
  // )
}
