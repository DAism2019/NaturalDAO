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
import { useFactoryContract,useTokenContract,usePriceContract } from '../../hooks'
import { Spinner } from '../../theme'
import CustomTimer from "../../components/CustomTimer"
import Circle from '../../assets/images/circle.svg'
import Fiat_ABI from '../../constants/abis/myFait'
import { getContract } from '../../utils'


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
    ContentWrapper:{
        marginLeft:theme.spacing(1)
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

function calPrice(_priceBigNum){
    _priceBigNum =  _priceBigNum.mul(100);
    let _priceDes = utils.formatEther(_priceBigNum);
    _priceDes = + _priceDes;
    return (1/_priceDes).toFixed(2);
}

function IcoDetail({history,icoAddress}) {
    const contract = useFactoryContract();
    const icoContract = useTokenContract(icoAddress);
    const priceContract = usePriceContract();
    const {t} = useTranslation();
    const classes = useStyles();
    const { active, account,library } = useWeb3Context()
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
        creater:''
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
        let _priceContract;
        async function listenPrice(){
           let  _priceAddress = await priceContract.fiator();
           // console.log("真实价格合约地址为:",_priceAddress);
           _priceContract = getContract(_priceAddress,Fiat_ABI,library,account);
           let _priceCur = await priceContract.getEthPrice();
           let _priceOfUSDCur = calPrice(_priceCur);
           // console.log("当前ETH价格为:",_priceOfUSDCur);
           setEthPrice(_priceOfUSDCur);
           _priceContract.on('SetEthPrice',async (_from,_to,event)=>{
               if (!adminInfos.canSubmit)
                   return;
               if(!infos.goalReached)
                   return;
               let flag = infos.creater && judgeSender(infos.creater)
               if(!flag)
                   return;
               let _price = await priceContract.getEthPrice();
               let _priceOfUSD = calPrice(_price);
               // console.log("更新后的ETH价格为:",_priceOfUSD);
               setEthPrice(_priceOfUSD);
               setSnacks({
                   show:true,
                   pos:'left',
                   message:t('price_update').replace('{price}',( _priceOfUSD + " $")),
                   type:'success'
               });
           });
        }
        listenPrice();
        return function cleanup() {
            if(icoContract){
                icoContract.removeAllListeners("Deposit");
                icoContract.removeAllListeners("CancelIco");
                icoContract.removeAllListeners("SubmitIco");
                icoContract.removeAllListeners("RefundTransfer");
            }
            if(_priceContract){
                _priceContract.removeAllListeners("SetEthPrice");
            }
        };
    }, []);

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
    //todo 这里要修改，用户投资后这里要有变化,需要结合事件进行测试
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
    async function refreshInfos(){
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
            result['isEnd'] = icoInfos[7];
            result['goalReached'] = icoInfos[8];
            result['isFailed'] = icoInfos[9];
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
    function getBaseInfo(classes){
        return(
            <div className={classes.ContentWrapper}>
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
                    {t('ico_isEnd') + (infos.isEnd ? t('YES') : t('NO'))}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_goalReached') + (infos.goalReached ? t('YES') : t('NO'))}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_tokenPrice').replace('{%symbol}',infos.symbol) + infos.price}
                </ContentWrapper>
                <ContentWrapper>
                    {t('ico_status') + infos.status}
                </ContentWrapper>
                {account && active &&  <ContentWrapper>
                     {t('my_deposit') + " " + myDeposit +  ' ETH'}
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
        method(...args, {
             value,
             gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN),
             gasPrice:utils.parseUnits('10.0','gwei')
            }).then(response => {
            setSnacks({
                show:true,
                pos:'left',
                message:t('has_send'),
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
                style={{width:"30%",marginTop:30}}
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
            <>
            {valid && <h4>
                {t('eth_price') + ethPrice + " $"}
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
            </h4>}

            <form className = {classes.container}  onSubmit={doSubmit}  autoComplete = "off" style={{marginTop:-10}}>
                {valid && <Fab
                    variant="extended"
                    size="medium"
                    color="primary"
                    aria-label="Add"
                    // className={classes.submit}
                    type='submit'
                    disabled={!valid}
                    style={{width:"30%",marginTop:35}}
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
                            style={{width:"30%",marginTop:valid?35:55}}
                        >
                            <CancelIcon />
                            {t('cancelIco')}
                        </Fab>
                </form>
            </>
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
