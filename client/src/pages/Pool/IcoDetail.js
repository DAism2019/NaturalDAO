import React, { useState, useEffect } from 'react'
import {useTranslation} from 'react-i18next'
import { withRouter } from 'react-router'
import {useWeb3Context} from 'web3-react'

import WithDrawIcon from '@material-ui/icons/AssignmentReturned'
import InputAdornment from '@material-ui/core/InputAdornment'
import TextField from '@material-ui/core/TextField'
import FormControl from '@material-ui/core/FormControl'
import {makeStyles} from '@material-ui/core/styles'
import TouchIcon from '@material-ui/icons/TouchApp'
import CancelIcon from '@material-ui/icons/Delete'
import SubmitIcon from '@material-ui/icons/PresentToAll'
import RefreshIcon from '@material-ui/icons/Refresh'
import Fab from '@material-ui/core/Fab';

import {utils} from 'ethers'
import styled from 'styled-components'

import { isAddress,calculateGasMargin} from '../../utils'
import { useFactoryContract,useTokenContract } from '../../hooks'
import { Spinner } from '../../theme'
import CustomTimer from "../../components/CustomTimer"
import Circle from '../../assets/images/circle.svg'


const GAS_MARGIN = utils.bigNumberify(1000)

const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20rem;
`
const ContentWrapper = styled.h4`
    height: 0.6em;
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

function  convertTimetoTimeString(_times) {
        let now = new Date(_times),
            y = now.getFullYear(),
            m = now.getMonth() + 1,
            d = now.getDate();
        return y + "-" + (
            m < 10
            ? "0" + m
            : m) + "-" + (
            d < 10
            ? "0" + d
            : d) + " " + now.toTimeString().substr(0, 8);
}

function IcoDetail({history, location,icoAddress}) {
    const contract = useFactoryContract();
    let icoContract = useTokenContract(icoAddress);
    const {t} = useTranslation();
    const classes = useStyles();
    const { active, account } = useWeb3Context()
    const [myDeposit,setMyDeposit] = React.useState(0);
    const [infos, setInfos] = React.useState({
        address:icoAddress,
        status:"",
        name: '',
        symbol: '',
        decimals: 0,
        goal:0,
        startAt:0,
        endAt:0,
        timeLeft: 0,
        submitAt:0,
        isEnd:false,
        goalReached:false,
        isFailed:false,
        price:0,
        depositAmount:0,
        creater:'',
    });
    const [showLoader, setShowLoader] = useState(true)
    const [ethPrice,setEthPrice] = React.useState(227.34);
    const [adminInfos,setAdminInfos] = React.useState({
        isCreater:false,
        canDeposit:false,
        canSubmit:false,
        canCanecl:false,
        canWithdraw:false
    });

    useEffect( () => {
        if (icoAddress && !isAddress(icoAddress)) {
          history.replace('/ico-detail');
        }else if(!icoAddress){
            setInfos({
                ...infos,
                status: 0
            });
        }else{
            async function getStatus() {
                let status  = await contract.allIcoStatus(icoAddress);
                status = + status;
                if(status !== 0){
                    //ICO详情
                    if(icoContract){
                        getIcoInfo(icoContract,status)
                    }
                }else{
                    setInfos({
                        ...infos,
                        status
                    });
                }
            }
            getStatus();
       }
    }, []);

    useEffect(() => {
        if(active && account  && infos.creater && account.toLowerCase() === infos.creater.toLowerCase()){
            setAdminInfos({
                isCreater:true
            });
        }
    }, [active,account,infos.creater]);

     useEffect(() => {
         if(active && account && icoContract){
             async function getDeposit(){
                 let _deposit = await icoContract.depositBalanceOfUser(account);
                 _deposit =  + (utils.formatEther(_deposit));
                 setMyDeposit(_deposit);
             }
             getDeposit();
         }
     },[active,account,icoContract]);

    function calStatusString(_status,isGoal,endAt,_submitTime){
        switch (_status) {
            case 2:
                return 'STATUS_SUCCESS';
            case 3:
                return 'STATUS_FAILED';
            case 1:
            default:
                let now =  Math.floor(Date.now()/1000);
                if(now < endAt){
                    if (isGoal){
                        return 'STATUS_COMPLETED';
                    }else{
                        return 'STATUS_STARTED';
                    }
                }else if(now < _submitTime)
                    return 'STATUS_SUBMIT';
                else
                    return 'STATUS_CANCEL';

        }
    }
    //todo 移到utils中去
    async function getIcoInfo(icoContract,status){
        let result = {
            address:icoContract.address
        };
        let icoInfos;
        try{
            icoInfos = await icoContract.icoInfo();
            let _endTime = + icoInfos[5];
            let _submitTime = + icoInfos[6];
            result['endAt'] = convertTimetoTimeString(_endTime * 1000);
            let _status = calStatusString(status,icoInfos[8],_endTime,_submitTime);
            result['status'] = t(_status);
            result['name'] = icoInfos[0];
            result['symbol'] = icoInfos[1];
            result['decimals'] =  + icoInfos[2];
            result['goal'] = utils.formatEther(icoInfos[3]);
            result['startAt'] = convertTimetoTimeString(+ (icoInfos[4] * 1000));
            result['submitAt'] = convertTimetoTimeString(_submitTime * 1000);
            result['isEnd'] = icoInfos[7] ? t('YES') : t('NO');
            result['goalReached'] = icoInfos[8] ? t('YES') : t('NO');
            result['isFailed'] = icoInfos[9] ? t('YES') : t('NO');
            let _price = + icoInfos[10].div(utils.parseUnits("1", result['decimals']));
            result['price'] = '1 ETH = '  + _price + " " + result['symbol']
            result['depositAmount'] = utils.formatEther(icoInfos[11]);
            result['creater'] = icoInfos[12];
            let _left = _endTime - Math.floor(Date.now()/1000);
            if (_left <= 0)
                _left = 0;
            result['timeLeft'] = _left;
            setInfos(result);
            setShowLoader(false);
            calStatus(_status);
        }catch(err){
            console.log(err);
            return ;
        }
    }

    function calStatus(_status){
        switch (_status) {
            case "STATUS_STARTED":
                setAdminInfos({
                    ...adminInfos,
                    canDeposit:true,
                    canSubmit:false,
                    canCanecl:false,
                    canWithdraw:false
                });
                break;
            case "STATUS_FAILED":
                setAdminInfos({
                    ...adminInfos,
                    canDeposit:false,
                    canSubmit:false,
                    canCanecl:false,
                    canWithdraw:true
                });
                break;
            case "STATUS_SUBMIT":
                setAdminInfos({
                    ...adminInfos,
                    canDeposit:false,
                    canSubmit:true,
                    canCanecl:false,
                    canWithdraw:false
                });
                break;
            case "STATUS_CANCEL":
                    setAdminInfos({
                        ...adminInfos,
                        canDeposit:false,
                        canSubmit:false,
                        canCanecl:true,
                        canWithdraw:false
                    });
                 break;
            case "STATUS_COMPLETED":
            case "STATUS_SUCCESS":
            default:
                 setAdminInfos({
                        ...adminInfos,
                        canDeposit:false,
                        canSubmit:false,
                        canCanecl:false,
                        canWithdraw:false
                 });
                 break;
        }

    }
    function getBaseInfo(){
        return(
            <div>
                <ContentWrapper>
                    {t('ico_address') + infos.address}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_creater') + infos.creater}
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
                    {t('ico_submitAt') + infos.submitAt}
                </ContentWrapper>
                <ContentWrapper>
                   <CustomTimer maxTime={infos.timeLeft}  color="black" label={t('ico_timer')} sstr=" " fontSize={16} />
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
                    {t('ico_status') + infos.status}
                </ContentWrapper>
                {account && active &&  <ContentWrapper>
                     {t('my_deposit') + myDeposit +  'ETH'}
                 </ContentWrapper>}
            </div>
        )
    }
    async function onDeposit(event){
        event.preventDefault();
        let estimate = icoContract.estimate.deposit
        let method = icoContract.deposit
        let data = new FormData(event.target);
        let value = data.get("deposit_amount");
        value = utils.parseEther(value);
        let args = [];
        let estimatedGasLimit = await estimate(...args, { value });
        method(...args, { value, gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN) }).then(response => {
            console.log(response);
          // addTransaction(response)
        });
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
                            margin="normal" type="float" variant="outlined"/>
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
                            style={{width:"30%",margin:5}}
                        >
                            <SubmitIcon  />
                            {t('submit_ico')}
                        </Fab>
                        {/* <Fab
                            variant="extended"
                            size="medium"
                            color="primary"
                            aria-label="Add"
                            className={classes.submit}
                            onClick = {doCancel}
                            type='button'
                            style={{width:"30%",margin:5}}
                        >
                            <CancelIcon />
                            {t('cancelIco')}
                        </Fab> */}
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
                    {t('ico_query_exist')}
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
            {adminInfos.canDeposit && getDepositUI(classes)}
            {adminInfos.canSubmit && adminInfos.isCreater && getSubmitUI(classes)}
            {adminInfos.canCanecl && getCancelUI(classes)}
            {adminInfos.canWithdraw && getWithDrawUI(classes)}
            </>
        )
    }

}

export default withRouter(IcoDetail)
