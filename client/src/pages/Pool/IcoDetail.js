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
import Fab from '@material-ui/core/Fab'
import {ethers,utils} from 'ethers'
import styled from 'styled-components'
import CustomSnackbar from '../../components/Snackbar'
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
    const icoContract = useTokenContract(icoAddress);
    const {t} = useTranslation();
    const classes = useStyles();
    const { active, account } = useWeb3Context()
    const [myDeposit,setMyDeposit] = useState(0);
    const [showLoader, setShowLoader] = useState(true)
    const [ethPrice,setEthPrice] = useState(227.34);
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
    const [adminInfos,setAdminInfos] = useState({
        canDeposit:false,
        canSubmit:false,
        canCanecl:false,
        canWithdraw:false
    });
    const [snacks,setSnacks] = useState({
        show: false,
        type: 'success',
        pos:"left",
        message:''
    });
    //set listener
    useEffect(()=>{
        if(icoContract){
            icoContract.on("Deposit", (_depositor, _amount, event) => {
                if(judgeSender(_depositor)){
                    //todo 通知
                    setSnacks({
                        show:true,
                        pos:'left',
                        message:'Deposit Success',
                        type:'success'
                    });
                }
                refreshInfos();
            });
            icoContract.on("CancelIco", (_cancer) => {
                if(judgeSender(_cancer)){
                    //todo 通知
                    setSnacks({
                        show:true,
                        pos:'left',
                        message:'Cancel ICO Success',
                        type:'success'
                    });
                }
                refreshInfos();
            });
            icoContract.on("SubmitIco", (_creater) => {
                if(judgeSender(_creater)){
                    //todo 通知
                    setSnacks({
                        show:true,
                        pos:'left',
                        message:'Sumbmit ICO Success',
                        type:'success'
                    });
                }
                refreshInfos();
            });
            let filter = icoContract.filters.RefundTransfer(account || ethers.constants.AddressZero);
            icoContract.on(filter, (_drawer, _amount, event) => {
               //todo 通知
               setSnacks({
                   show:true,
                   pos:'left',
                   message:'Withdraw Success',
                   type:'success'
               });
               refreshInfos();
            });
        }
        return function cleanup() {
            if(icoContract){
                icoContract.removeAllListeners("Deposit");
                icoContract.removeAllListeners("CancelIco");
                icoContract.removeAllListeners("SubmitIco");
                icoContract.removeAllListeners("RefundTransfer");
            }
        };
    },[]);

    //get ico info first
    useEffect(() => {
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
                        getIcoInfo(status)
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

    //get user deposit
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

     //judge user
     function judgeSender(_sender){
         return active && account && _sender.toLowerCase() === account.toLowerCase()
     }

     //get the ico status string
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

    // refresh ico info
    async function refreshInfos(icoAddress){
        let status  = await contract.allIcoStatus(icoAddress);
        status = + status;
        getIcoInfo(status);
    }

    //get ico info detail
    async function getIcoInfo(status){
        let result = {
            address:icoContract.address
        };
        try{
            let icoInfos = await icoContract.icoInfo();
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
            refreshStatus(_status);
        }catch(err){
            console.log(err);
            return ;
        }
    }

    // refresh status UI by status string
    function refreshStatus(_status){
        switch (_status) {
            case "STATUS_STARTED":
                setAdminInfos({
                    canDeposit:true,
                    canSubmit:false,
                    canCanecl:false,
                    canWithdraw:false
                });
                break;
            case "STATUS_FAILED":
                setAdminInfos({
                    canDeposit:false,
                    canSubmit:false,
                    canCanecl:false,
                    canWithdraw:true
                });
                break;
            case "STATUS_SUBMIT":
                setAdminInfos({
                    canDeposit:false,
                    canSubmit:true,
                    canCanecl:false,
                    canWithdraw:false
                });
                break;
            case "STATUS_CANCEL":
                    setAdminInfos({
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
                        canDeposit:false,
                        canSubmit:false,
                        canCanecl:false,
                        canWithdraw:false
                 });
                 break;
        }
    }

    //get the base info of ICO
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

    // do deposit
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
            setSnacks({
                show:true,
                pos:'left',
                message:'Transaction has send,please wait!',
                type:'success'
            });
        });
    }

    //show deposit UI
    function getDepositUI(classes){
        let valid = active && account
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
                         disabled={!valid}
                        style={{width:"30%"}}
                    >
                        <TouchIcon />
                        {t('deposit')}
                    </Fab>
            </form>
        )
    }

    //do cancel
    function doCancel(){

    }

    //show cancelUI
    function getCancelUI(classes){
        let valid = active && account
        return(
            <form className = {classes.container}  onSubmit={doCancel}  autoComplete = "off" >
            <Fab
                variant="extended"
                size="medium"
                color="primary"
                aria-label="Add"
                className={classes.submit}
                type='submit'
                disabled={!valid}
                style={{width:"30%",marginTop:30}}
            >
                <CancelIcon />
                {t('cancelIco')}
            </Fab>
        </form>
        )
    }

    //do submit
    function doSubmit(){

    }

    //refresh the price of eth
    function doRefreshPrice(){

    }

    //show the submit UI
    function getSubmitUI(classes){
        let valid = infos.goalReached;
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
                            disabled={!valid}
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
                            disabled={infos.isFailed}
                            type='button'
                            style={{width:"30%",margin:5}}
                        >
                            <CancelIcon />
                            {t('cancelIco')}
                        </Fab>
                </form>
            </>
        )
    }

    //do withdraw
    function doWithDraw(){

    }

    //show withdraw UI
    function getWithDrawUI(classes){
        let valid = active && account && infos.myDeposit
        return(
            <form className = {classes.container}  onSubmit={doWithDraw}  autoComplete = "off" >
            <Fab
                variant="extended"
                size="medium"
                color="primary"
                aria-label="Add"
                className={classes.submit}
                type='submit'
                disabled={!valid}
                style={{width:"30%",marginTop:30}}
            >
                <WithDrawIcon className={classes.extendedIcon} />
                {t('withdraw')}
            </Fab>
        </form>
        )
    }

    //hide the Snack
    function hideSnack(){
        setSnacks({
            show:false,
            pos:'left',
            message:'',
            type:''
        })
    }

    if(infos.status === 0){
        return (
            <>
                <MessageWrapper>
                    {t('ico_query_exist')}
                </MessageWrapper>
            </>
        )
    }else if(showLoader){
        return (
          <MessageWrapper>
            <SpinnerWrapper src={Circle} />
          </MessageWrapper>)
    }else{
        let flag = infos.creater && judgeSender(infos.creater)
        return (
            <>
            {getBaseInfo()}
            {adminInfos.canDeposit && getDepositUI(classes)}
            {adminInfos.canSubmit && flag && getSubmitUI(classes)}
            {adminInfos.canCanecl && getCancelUI(classes)}
            {adminInfos.canWithdraw && getWithDrawUI(classes)}
            {snacks.show && <CustomSnackbar type={snacks.type} message = {snacks.message} pos= {snacks.pos} cb={hideSnack}/>}
            </>
        )
    }

}

export default withRouter(IcoDetail)
