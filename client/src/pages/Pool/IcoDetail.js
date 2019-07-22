import React, { useState, useEffect } from 'react'
import { isAddress } from '../../utils'
import {ethers,utils} from 'ethers'
import { useFactoryContract } from '../../hooks'
import {useTranslation} from 'react-i18next'
import {useWeb3Context} from 'web3-react'
import { withRouter } from 'react-router'
import TextField from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import {makeStyles} from '@material-ui/core/styles'
import Fab from '@material-ui/core/Fab';
import TouchIcon from '@material-ui/icons/TouchApp'
import CancelIcon from '@material-ui/icons/Delete'
import WithDrawIcon from '@material-ui/icons/AssignmentReturned'
import SubmitIcon from '@material-ui/icons/PresentToAll'
import RefreshIcon from '@material-ui/icons/Refresh'
import { Spinner } from '../../theme'
import styled from 'styled-components'
import InputAdornment from '@material-ui/core/InputAdornment'
import Circle from '../../assets/images/circle.svg'


const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20rem;
`
const ContentWrapper = styled.h4`
    height: 0.9rem;
`

const SpinnerWrapper = styled(Spinner)`
  font-size: 4rem;

  svg {
    path {
      color: ${({ theme }) => theme.uniswapPink};
    }
  }
`

const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: theme.spacing(-3),
        width: 550
    },
    textField: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1)
    },
    submit: {
        marginTop: theme.spacing(2),
        width: "50%"
    }
}));


function IcoDetail({history, location,icoAddress}) {
    const contract = useFactoryContract();
    const {t} = useTranslation();
    const classes = useStyles();
    const { active, account,error } = useWeb3Context()
    const [infos, setInfos] = React.useState({
        address:icoAddress,
        status:'',
        name: '',
        symbol: '',
        decimals: '',
        goal:'',
        startAt:'',
        endAt:'',
        submitAt:'',
        isEnd:'',
        goalReached:'',
        isFailed:'',
        price:'',
        depositAmount:'',
        myDeposit:0,
        creater:'',

    });
    const [ethPrice,setEthPrice] = React.useState(227.34);
    const [adminInfos,setAdminInfos] = React.useState({
        isCreater:false,
        canDeposit:true,
        canSubmit:false,
        canCanecl:false,
        canWithdraw:false
    });
    const [showLoader, setShowLoader] = useState(true)
    useEffect(() => {
        if (icoAddress && !isAddress(icoAddress)) {
          history.replace('/ico-detail');
        }else if(!icoAddress){
            setInfos({
                ...infos,
                status: 0
            });
        }else{
            //todo
            getIcoInfo(icoAddress);
        }
    }, []);
    useEffect(() => {
        if(active && account  && infos.creater && account.toLowerCase() === infos.creater.toLowerCase()){
            setAdminInfos({
                isCreater:true
            });
        }
    }, [active,account,infos.creater]);
    //todo 移到utils中去
    async function getIcoInfo(_address){
        return setShowLoader(false);
        let result = {
            address:_address,
            status:'',
            name: '',
            symbol: '',
            decimals: '',
            goal:'',
            startAt:'',
            endAt:'',
            submitAt:'',
            isEnd:'',
            goalReached:'',
            isFailed:'',
            price:'',
            depositAmount:'',
            creater:''
        };
        let _status = await contract.allIcoStatus(_address);
        _status = + _status;
        result["status"] = _status;
        if(_status !== 0){
            let _infos = await contract.icoInfo();
            console.log(_infos)
        }
        setInfos(result);
    }
    function getBaseInfo(){
        return(
            <div>
                <ContentWrapper>
                    {t('ico_address') + infos.address}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_name') + infos.name}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_symbol') + infos.symbol}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_decimals') + infos.decimals}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_goal') + infos.goal + 'ETH'}
                </ContentWrapper>
                <ContentWrapper>
                    {t('depositAmount') + infos.depositAmount + 'ETH'}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_startAt') + infos.startAt}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_endAt') + infos.endAt}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_isEnd') + infos.isEnd}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_goalReached') + infos.goalReached}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_tokenPrice').replace('{%symbol}',infos.symbol) + infos.price}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_creater') + infos.creater}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_status') + infos.status}
                </ContentWrapper>
                {account && active &&  <ContentWrapper>
                     {t('my_deposit') + infos.myDeposit +  'ETH'}
                 </ContentWrapper>}
            </div>
        )
    }
    function onDeposit(){

    }
    function getDepositUI(classes){
        let invalid = active && account
        return (
                <form className = {classes.container}  onSubmit={onDeposit}  autoComplete = "off" >
                    <FormControl margin="normal" required fullWidth>
                        <TextField required id="outlined-deposit-required"
                            label={t('deposit_amount')} name='deposit_amount'
                            className={classes.textField}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">ETH</InputAdornment>
                            }}
                            margin="normal" type="number" variant="outlined"/>
                    </FormControl>

                    <Fab
                        variant="extended"
                        size="medium"
                        color="primary"
                        aria-label="Add"
                        className={classes.submit}
                        type = 'submit'
                         disabled={!invalid}
                        style={{width:"30%"}}
                    >
                        <TouchIcon />
                        {t('deposit')}
                    </Fab>

            </form>
        )
    }
    function doCancel(){

    }
    function getCancelUI(classes){
        let invalid = active && account
        return(
            <form className = {classes.container}  onSubmit={doCancel}  autoComplete = "off" >
            <Fab
                variant="extended"
                size="medium"
                color="primary"
                aria-label="Add"
                className={classes.submit}
                type='submit'
                disabled={!invalid}
                style={{width:"30%",marginTop:30}}
            >
                <CancelIcon />
                {t('cancelIco')}
            </Fab>
        </form>
        )

    }
    function doSubmit(){

    }
    function doRefreshPrice(){

    }
    function getSubmitUI(classes){
        let invalid = active && account
        return(
            <>
            <h4>
                {t('eth_price') + ethPrice + "$"}
                <Fab
                    variant="extended"
                    size="small"
                    color="secondary"
                    aria-label="Add"
                    type='button'
                    disabled={!invalid}
                    // className={classes.submit}
                    onClick={doRefreshPrice}
                    style={{width:"25%",marginLeft:80}}
                >
                    <RefreshIcon  />
                    {t('refreshPrice')}
                </Fab>
            </h4>
            <form className = {classes.container}  onSubmit={doSubmit}  autoComplete = "off" style={{marginTop:-10}}>
                        <Fab
                            variant="extended"
                            size="medium"
                            color="primary"
                            aria-label="Add"
                            className={classes.submit}
                            type='submit'
                            disabled={!invalid}
                            style={{width:"30%",margin:5}}
                        >
                            <SubmitIcon  />
                            {t('submit_ico')}
                        </Fab>
                        <Fab
                            variant="extended"
                            size="medium"
                            color="primary"
                            aria-label="Add"
                            className={classes.submit}
                            onClick = {doCancel}
                            type='button'
                            disabled={!invalid}
                            style={{width:"30%",margin:5}}
                        >
                            <CancelIcon />
                            {t('cancelIco')}
                        </Fab>
        </form>
            </>


        )
    }
    function doWithDraw(){

    }
    function getWithDrawUI(classes){
        let invalid = active && account
        return(
            <form className = {classes.container}  onSubmit={doWithDraw}  autoComplete = "off" >
            <Fab
                variant="extended"
                size="medium"
                color="primary"
                aria-label="Add"
                className={classes.submit}
                type='submit'
                disabled={!invalid}
                style={{width:"30%",marginTop:30}}
            >
                <WithDrawIcon className={classes.extendedIcon} />
                {t('withdraw')}
            </Fab>
        </form>
        )
    }

    if(infos.status === 0){
        return (
            <>
                <h1>
                    {t('ico_not_exist')}
                </h1>

            </>
        )
    }else if(showLoader){
        return (
          <MessageWrapper>
            <SpinnerWrapper src={Circle} />
          </MessageWrapper>)
    }else{
        return (
            <>
            {getBaseInfo()}
            {/* {adminInfos.canDeposit && getDepositUI(classes)}
            {adminInfos.canSubmit && getSubmitUI(classes)}
            {adminInfos.canCanecl && getCancelUI(classes)}
            {adminInfos.canWithdraw && getWithDrawUI(classes)} */}
            </>
        )
    }

}

export default withRouter(IcoDetail)
