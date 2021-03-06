import React, { useState, useEffect, useCallback} from 'react'
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
// import signal from 'signal-js';
import { useTransactionAdder } from '../../contexts/Transactions'
import styled from 'styled-components'
import CustomSnackbar from '../../components/Snackbar'
import { isAddress,calculateGasMargin} from '../../utils'
import { useFactoryContract,useTokenContract,usePriceContract } from '../../hooks'
import { Spinner } from '../../theme'
import CustomTimer from "../../components/CustomTimer"
import Circle from '../../assets/images/circle.svg'
import { useEthPrice } from '../../contexts/EthPrice'
import { isMobile } from 'react-device-detect'
import i18n from '../../i18n'


const GAS_MARGIN = utils.bigNumberify(1000)
const MessageWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 20rem;
`
const ContentWrapper = isMobile
? styled.h5`
    height: 0.4em;
`
:styled.h4`
    height: 0.4em;
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
        marginTop: theme.spacing(3)
    },
    containerDeposit: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: theme.spacing(-3)
    },
    ContentWrapper:{
        marginLeft:theme.spacing(1)
    },
    textField: {
    },
    submit: {
        margin: theme.spacing(2)
    },
    refreshBtn:{
        width:isMobile ? "45%":"25%",
        marginLeft:isMobile ? theme.spacing(4):theme.spacing(10),
        marginTop:theme.spacing(-1)
    },
    refreshBtnAlone:{
        width:"45%",
        margin:theme.spacing(0)
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

function calPrice(_priceBigNum){
    if(!_priceBigNum)
        return ''
    _priceBigNum =  _priceBigNum.mul(100);
    let _priceDes = utils.formatEther(_priceBigNum);
    _priceDes = + _priceDes;
    return (1/_priceDes).toFixed(2);
}

function IcoDetail({history,icoAddress}) {
    let hash = history.location.hash
    let len = hash.length
    if(len  && !icoAddress){
        icoAddress = hash.substr(1,len)
    }
    const contract = useFactoryContract();
    const icoContract = useTokenContract(icoAddress);
    const priceContract = usePriceContract();
    const {t} = useTranslation();
    const classes = useStyles();
    const [clicked,setClicked] = useState(false)
    const { active, account } = useWeb3Context()
    const [myDeposit,setMyDeposit] = useState(0);
    const [showLoader, setShowLoader] = useState(true);
    const ethPrice = useEthPrice();
    const [priceOfUSD,setPriceOfUSD] = useState();
    const [infos, setInfos] = React.useState({
        address:icoAddress,
        status:"",
        name: '',
        symbol: '',
        decimals: 0,
        reversedTokens:0,
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
        creater:''
    });
    const [exchangeAddress,setExchangeAddress] = useState();
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
    const addTransaction = useTransactionAdder()
    const judgeSender = useCallback((_sender) => {
        return active && account && _sender.toLowerCase() === account.toLowerCase()
    },[active,account]);
    const getExchangeAddress = useCallback(async (tokenAddress) => {
         let _exchangeAddress = await contract.getExchange(icoAddress);
         setExchangeAddress(_exchangeAddress);
     },[contract,icoAddress])
    //get ico info detail
    const getIcoInfo = useCallback(async(status) => {
        let result = {
            address:icoContract.address
        };
        try{
            let icoInfos = await icoContract.getIcoInfo();
            let _endTime = + icoInfos[5];
            let _submitTime = + icoInfos[6];
            result['endAt'] = convertTimetoTimeString(_endTime * 1000);
            let _status = calStatusString(status,icoInfos[8],_endTime,_submitTime);
            result['status'] = _status ;
            result['name'] = icoInfos[0];
            result['symbol'] = icoInfos[1];
            result['decimals'] =  + icoInfos[2];
            result['goal'] = utils.formatEther(icoInfos[3]);
            result['startAt'] = convertTimetoTimeString(+ (icoInfos[4] * 1000));
            result['submitAt'] = convertTimetoTimeString(_submitTime * 1000);
            result['isEnd'] = icoInfos[7];
            result['goalReached'] = icoInfos[8];
            result['isFailed'] = icoInfos[9];
            let _price = + (icoInfos[10].div(utils.parseUnits("1", result['decimals'])));
            result['price'] = _price;
            result['depositAmount'] = utils.formatEther(icoInfos[11]);
            result['creater'] = icoInfos[12];
            result['reversedTokens'] = utils.formatUnits(icoInfos[13],result['decimals']);
            let _left = _endTime - Math.floor(Date.now()/1000);
            if (_left <= 0)
                _left = 0;
            result['timeLeft'] = _left;
            setInfos(result);
            setShowLoader(false);
            refreshStatus(_status);
            if(_status === 'STATUS_SUCCESS'){
                getExchangeAddress();
            }
        }catch{
        }
    },[icoContract,getExchangeAddress])
    const refreshInfos = useCallback(async () =>{
        let status  = await contract.allIcoStatus(icoAddress);
        status = + status;
        getIcoInfo(status);
    },[contract,icoAddress,getIcoInfo]);
    // set listener
    useEffect(()=>{
        if(icoContract){
            icoContract.on("Deposit", (_depositor, _amount, event) => {
                if(judgeSender(_depositor)){
                    //todo 通知
                    setSnacks({
                        show:true,
                        pos:'left',
                        message:t('deposit_success'),
                        type:'success'
                    });
                    //增加刷新自己投资额度
                    icoContract.depositBalanceOfUser(account).then(_deposit =>{
                        _deposit =  + (utils.formatEther(_deposit));
                        setMyDeposit(_deposit);
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
                        message:t('cancel_success'),
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
                        message:t('submit_success'),
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
                   message:t('withdraw_success'),
                   type:'success'
               });
               refreshInfos();
            });
        }
        //监听刷新ETH价格变化
        // signal.on('updatePrice', (from,price) => showUpdatePriceTip(from,price));
        return  () => {
            if(icoContract){
                icoContract.removeAllListeners("Deposit");
                icoContract.removeAllListeners("CancelIco");
                icoContract.removeAllListeners("SubmitIco");
                icoContract.removeAllListeners("RefundTransfer");
            }
            // signal.off('updatePrice');
        };
    }, [icoContract,account,judgeSender,refreshInfos,t]);

    useEffect(()=>{
        let _price = calPrice(ethPrice);
        setPriceOfUSD(_price)
    },[ethPrice])

    //get ico info first
    useEffect(() => {
        if (icoAddress && !isAddress(icoAddress)) {
          history.replace('/ico-detail');
        }else if(!icoAddress){
            setInfos({
                // ...infos,
                status: 0
            });
        }else{
            setShowLoader(true)
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
                        // ...infos,
                        status
                    });
                }
            }
            getStatus();
       }
   }, [icoAddress,contract,getIcoInfo,history,icoContract]);

    //get user deposit
    useEffect(() => {
         if(active && account && icoContract ){
             async function getDeposit(){
                 let status  = await contract.allIcoStatus(icoContract.address);
                 status = + status;
                 if(status === 0)
                    return;
                 let _deposit = await icoContract.depositBalanceOfUser(account);
                 _deposit =  + (utils.formatEther(_deposit));
                 setMyDeposit(_deposit);
             }
             getDeposit();
         }
     },[active,account,icoContract,contract]);

     // function showUpdatePriceTip(from,price) {
     //     console.log("ICO界面监听到ETH价格变化",from,price)
     //     if (!adminInfos.canSubmit)
     //         return;
     //     if(!infos.goalReached)
     //         return;
     //     let flag = (infos.creater && infos.creater.toLowerCase() === from.toLowerCase() && judgeSender(infos.creater))
     //     if(!flag)
     //         return;
     //     setSnacks({
     //         show:true,
     //         pos:'left',
     //         message:t('price_update').replace('{price}',(calPrice(ethPrice) + " $")),
     //         type:'success'
     //     });
     // }
     //judge user

     // function judgeSender(_sender){
     //     return active && account && _sender.toLowerCase() === account.toLowerCase()
     // }

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
    function getBaseInfo(classes){
        return(
            <div className={classes.ContentWrapper}>
                {isMobile ? <>
                    <ContentWrapper>
                    {t('ico_address')}
                    </ContentWrapper>
                    <ContentWrapper>
                        {infos.address}
                    </ContentWrapper>
                   </>
                :<ContentWrapper>
                    {t('ico_address') + infos.address}
                </ContentWrapper>
               }
               {isMobile ? <>
                   <ContentWrapper>
                   {t('ico_creater')}
                   </ContentWrapper>
                   <ContentWrapper>
                       {infos.creater}
                   </ContentWrapper>
               </> : <ContentWrapper>
                    {t('ico_creater') + infos.creater}
                    </ContentWrapper>
               }

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
                    {t('reversedTokens') + utils.commify( + infos.reversedTokens) + ' ' + infos.symbol}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_tokens') +  utils.commify((+ infos.goal ) *  (+ infos.price)) + ' ' + infos.symbol}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_goal') + infos.goal + 'ETH'}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_tokenPrice').replace('{%symbol}',infos.symbol) + '1 ETH = ' +  infos.price + ' ' + infos.symbol }
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
                   <CustomTimer maxTime={infos.timeLeft}  color="black" label={t('ico_timer')} sstr=" " cb={refreshInfos} fontSize={isMobile?14:16} />
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_isEnd') + (infos.isEnd ? t('YES') : t('NO'))}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_goalReached') + (infos.goalReached ? t('YES') : t('NO'))}
                </ContentWrapper>

                <ContentWrapper>
                    {t('ico_status') + t(infos.status)}
                </ContentWrapper>
                {account && active &&  <ContentWrapper>
                     {t('my_deposit') + " " + myDeposit +  ' ETH'}
                 </ContentWrapper>}
                { (infos.status === 'STATUS_SUCCESS' && exchangeAddress && !isMobile) && <ContentWrapper>
                  {t('exchange_address') + exchangeAddress}
                </ContentWrapper>}
                { (infos.status === 'STATUS_SUCCESS' && exchangeAddress && isMobile) &&
                <>
                <ContentWrapper>
                  {t('exchange_address')}
                </ContentWrapper>
                <ContentWrapper>
                  {exchangeAddress}
                </ContentWrapper>
                </>}
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
        try{
           value = utils.parseEther(value);
       }catch{
           return setSnacks({
               show:true,
               pos:'left',
               message:t('invalid_number'),
               type:'error'
           });
       }
       setClicked(true);
       let _time = setTimeout(()=>{
             setClicked(false);
             clearTimeout(_time);
       },1000)

       let args = [];
       let estimatedGasLimit = await estimate(...args, { value });
       method(...args, {
           value,
           gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
           gasPrice:utils.parseUnits('10.0','gwei')
           }).then(response => {
              addTransaction(response)
                    // setClicked(false);
              setSnacks({
                  show:true,
                  pos:'left',
                  message:t('has_send'),
                  type:'success'
              });
        }).catch((error) =>{
               // console.log("error")
               // setClicked(false);
        });
    }

    //show deposit UI
    function getDepositUI(classes){
        let valid = active && account
        return (
                <form className = {classes.containerDeposit}  onSubmit={onDeposit}  autoComplete = "off" >
                    <FormControl margin="normal" required fullWidth >
                        <TextField required id="outlined-deposit-required"
                            label={t('deposit_amount')} name='deposit_amount'
                            className={classes.textField}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">ETH</InputAdornment>
                            }}
                            margin="normal" variant="outlined"/>
                    </FormControl>
                    <Fab
                        variant="extended"
                        size="medium"
                        color="primary"
                        aria-label="Add"
                        className={classes.submit}
                        type = 'submit'
                         disabled={!valid || clicked}
                        style={{width:isMobile ? "50%" :"40%"}}
                    >
                        <TouchIcon />
                        {t('deposit')}
                    </Fab>
            </form>
        )
    }

    //do cancel
    async function doCancel(event){
        if (event)
            event.preventDefault();
        let estimate = icoContract.estimate.cancelICO
        let method = icoContract.cancelICO
        let args = [];
        let estimatedGasLimit = await estimate(...args);
        method(...args, {
             gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
             gasPrice:utils.parseUnits('10.0','gwei')
            }).then(response => {
                addTransaction(response)
                setSnacks({
                    show:true,
                    pos:'left',
                    message:t('has_send'),
                    type:'success'
                });
        });
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
                style={{width:isMobile ? "50%" :"40%"}}
            >
                <CancelIcon />
                {t('cancelIco')}
            </Fab>
        </form>
        )
    }

    //do submit
    async function doSubmit(event){
        event.preventDefault();
        let estimate = icoContract.estimate.submitICO
        let method = icoContract.submitICO
        let args = [];
        let estimatedGasLimit = await estimate(...args);
        method(...args, {
            gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
            gasPrice:utils.parseUnits('10.0','gwei')
            }).then(response => {
                addTransaction(response)
                setSnacks({
                    show:true,
                    pos:'left',
                    message:t('has_send'),
                    type:'success'
                });
        });
    }

    //refresh the price of eth
    async function doRefreshPrice(event){
        if(event)
            event.preventDefault();
        let estimate = priceContract.estimate.updateEthPrice
        let method = priceContract.updateEthPrice
        let args = [];
        //todo 这里以后详细设计
        let value = utils.parseEther("0.008");
        let estimatedGasLimit = await estimate(...args, { value });
        method(...args, {
            value,
            gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
            gasPrice:utils.parseUnits('10.0','gwei')
            }).then(response => {
                addTransaction(response)
                setSnacks({
                    show:true,
                    pos:'left',
                    message:t('has_send'),
                    type:'success'
                });
        });
    }

    //show the submit UI
    function getSubmitUI(classes){
        let valid = infos.goalReached;
        return(
            <div>
            {(valid && i18n.language!=='en') && <ContentWrapper style={{marginLeft:8}}>
                {t('eth_price') + priceOfUSD + " $"}
                <span>
                    <Fab
                        variant="extended"
                        size="small"
                        color="secondary"
                        aria-label="Add"
                        type='button'
                        // className={classes.submit}
                        onClick={doRefreshPrice}
                        className = {classes.refreshBtn}
                    >
                        <RefreshIcon  />
                        {t('refreshPrice')}
                    </Fab>
                </span>

             </ContentWrapper>}
            {(valid && i18n.language ==='en') &&
                <ContentWrapper style={{marginLeft:8}}>
                    {t('eth_price') + priceOfUSD + " $"}
                </ContentWrapper>
             }

            <form className = {classes.container}
                onSubmit={doSubmit}  autoComplete = "off" >
                {(valid && i18n.language ==='en') &&
                    <Fab
                        variant="extended"
                        size="small"
                        color="secondary"
                        aria-label="Add"
                        type='button'
                        // className={classes.submit}
                        onClick={doRefreshPrice}
                        className = {classes.refreshBtnAlone}
                    >
                        <RefreshIcon  />
                        {t('refreshPrice')}
                    </Fab>}

                {valid && <Fab
                    variant="extended"
                    size="medium"
                    color="primary"
                    aria-label="Add"
                    className={classes.submit}
                    type='submit'
                    disabled={!valid}
                    style={{width:isMobile ? "50%" :"40%"}}

                >
                    <SubmitIcon  />
                    {t('submit_ico')}
                </Fab>}

                        <Fab
                            variant="extended"
                            size="medium"
                            color="primary"
                            aria-label="Add"
                            onClick = {doCancel}
                            disabled={infos.isFailed}
                            type='button'
                            // style={{width:isMobile ? "50%" :"40%",marginTop:valid?25:35}}
                             className={classes.submit}
                             style={{width:isMobile ? "50%" :"40%"}}
                        >
                            <CancelIcon />
                            {t('cancelIco')}
                        </Fab>
                </form>
            </div>
        )
    }

    //do withdraw
    async function doWithDraw(event){
        event.preventDefault();
        let estimate = icoContract.estimate.safeWithdrawal
        let method = icoContract.safeWithdrawal
        let args = [];
        let estimatedGasLimit = await estimate(...args);
        method(...args, {
             gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
             gasPrice:utils.parseUnits('10.0','gwei')
            }).then(response => {
                addTransaction(response)
                setSnacks({
                    show:true,
                    pos:'left',
                    message:t('has_send'),
                    type:'success'
                });
        });
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
                style={{width:isMobile ? "50%" :"40%"}}
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
                    {t('ico_query_first')}
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
            {getBaseInfo(classes)}
            {adminInfos.canDeposit && getDepositUI(classes)}
            {adminInfos.canSubmit && flag && getSubmitUI(classes)}
            {adminInfos.canCanecl && getCancelUI(classes)}
            {adminInfos.canWithdraw && getWithDrawUI(classes)}
            {snacks.show && <CustomSnackbar type={snacks.type} message = {snacks.message} pos= {snacks.pos} cb={hideSnack} cb2={snacks.cb2}/>}
            </>
        )
    }

}

export default withRouter(IcoDetail)
