import React, { useState, useEffect } from 'react'
import {withRouter} from 'react-router'
import {useWeb3Context} from 'web3-react'
import {ethers,utils} from 'ethers'
import {makeStyles} from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import {useTranslation} from 'react-i18next'
import FormControl from '@material-ui/core/FormControl';
import InputAdornment from '@material-ui/core/InputAdornment';
import { Button } from '../../theme'
import { useTransactionAdder } from '../../contexts/Transactions'
import { useFactoryContract } from '../../hooks'
import { calculateGasMargin } from '../../utils'
import CustomSnackbar from '../../components/Snackbar'
import { isMobile } from 'react-device-detect'


function checkOnlyChar(_str) {
    let pattern = new RegExp("[A-Za-z]+");
    return pattern.test(_str);
}


const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: theme.spacing(-3),
        // width: 550
    },
    textField: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        marginBottom:theme.spacing(-0.2),
    },
    dense: {
        marginTop: theme.spacing(2)
    },
    menu: {
        width: 200
    },
    submit: {
        margin: theme.spacing(isMobile ? 2 : 3),
        width:isMobile ? "80%" : "60%"
    }
}));

const fixedNumber = 6;

const decimals = [12,15, 18];
const GAS_MARGIN = utils.bigNumberify(1000);
function CreateIco({ history }) {
    const {t} = useTranslation();
    const classes = useStyles();
    const { active, account,error } = useWeb3Context()
    const contract = useFactoryContract()
    // const [clicked,setClicked] = useState(false)
    const [values, setValues] = useState({
        name: '',
        symbol: '',
        decimals: 18,
        goal:'',
        timedelta:'',
        price:'',
        tokens:'',
        reversedTokens:0
    });
    const [snacks,setSnacks] = useState({
        show: false,
        type: 'success',
        pos:"left",
        message:'',
        cb2:null
    });
    const addTransaction = useTransactionAdder()
    //listen event
    useEffect(()=>{
        let filter = contract.filters.ICOCreated(account || ethers.constants.AddressZero);
        contract.on(filter, (_creater, _ico, event) => {
           setSnacks({
               show:true,
               pos:'left',
               message:t('create_success'),
               type:'success',
               cb2:()=>{
                    history.push('/ico-detail#' + _ico);
               }
           });
        });
        return function cleanup() {
              contract.removeAllListeners("ICOCreated");
        };
    },[account,t,history,contract]);
    //hide the Snack
    function hideSnack(){
        setSnacks({
            show:false,
            pos:'left',
            message:'',
            type:''
        });
    }

    async function _createIco(event){
        event.preventDefault();
        let estimate = contract.estimate.createICO
        let method = contract.createICO
        let {name,symbol,decimals,goal,timedelta,price,reversedTokens} = values;
        if(!checkOnlyChar(name) || !checkOnlyChar(symbol)){
            return setSnacks({
                show:true,
                pos:'left',
                message:t('only_letters'),
                type:'error'
            });
        }
        if(decimals < 3 ||  decimals > 18){
            return;
        }
        // setClicked(true);
        // let _time = setTimeout(()=>{
        //       setClicked(false);
        //       clearTimeout(_time);
        // },1000);
        try{
            goal =  utils.parseEther(goal);
            timedelta = + timedelta;
            timedelta = parseInt(timedelta * 24 * 3600);
            price =  _calPrice() * 10 ** fixedNumber;
            price = utils.bigNumberify(price);
            let _ten = utils.bigNumberify(10);
            let _des = _ten.pow(decimals);
            let _devider = _ten.pow(fixedNumber);
            price = _des.mul(price).div(_devider);
            let _reserved = _des.mul(reversedTokens);
            let args = [name,symbol,decimals,goal,timedelta,price,_reserved];
            let value = ethers.constants.Zero;
            const estimatedGasLimit = await estimate(...args, { value });
            method(...args, {
                 value,
                 gasPrice:utils.parseUnits('10.0','gwei'),
                 gasLimit: calculateGasMargin(estimatedGasLimit, GAS_MARGIN) }).then(response => {
                    addTransaction(response)
                    // setClicked(false)
                    setSnacks({
                        show:true,
                        pos:'left',
                        message:t('has_send'),
                        type:'success'
                    });
            }).catch(err =>{
                    console.log(err);
                    // setClicked(false)
                    return setSnacks({
                        show:true,
                        pos:'left',
                        message:t('invalid_number'),
                        type:'error'
                    });


            });
        }catch(err){
            // setClicked(false);
            return setSnacks({
                show:true,
                pos:'left',
                message:t('invalid_number'),
                type:'error'
            });
        }
    }

    function _calPrice(){
        let _goal = + values.goal;
        let _tokens = + values.tokens;
        if (Number.isNaN(_goal) || Number.isNaN(_tokens)){
            return 0;
        }else if ( _goal<= 0 || _tokens <= 0){
            return 0;
        }else{
            return  + ((_tokens/_goal).toFixed(fixedNumber));
        }
    }
    //这里使用了闭包
    const handleChange = name => event => {
        setValues({
            ...values,
            [name]: event.target.value
        });
    };
    const isValid = active && account && (!error);
    return (
        <>
            <form className = {classes.container}  onSubmit={_createIco}  autoComplete = "off" >
                <FormControl margin="normal" required fullWidth>
                       <TextField required id="outlined-name-required"
                           name="icoName" label={t('icoName')} value={values.name}
                           onChange={handleChange('name')} className={classes.textField}
                           margin="normal" type="string" variant="outlined"/>
                       <TextField required id="outlined-symbol-required"
                           name="icoSymbol" label={t('icoSymbol')} value={values.symbol}
                           onChange={handleChange('symbol')} className={classes.textField}
                           margin="normal" type="string" variant="outlined"/>
                       <TextField id="outlined-select-currency" type="number" required
                           select label={t('icoDecimals')} className={classes.textField} SelectProps={{
                               MenuProps: {
                                   className: classes.menu
                               }
                           }}
                           value={values.decimals} onChange={handleChange('decimals')}
                            margin="normal" variant="outlined">
                            {
                                decimals.map(value => (<MenuItem key={value} value={value}>
                                    {value}
                                </MenuItem>))
                            }
                        </TextField>
                        <TextField required id="outlined-timedelta-required"
                            name="reversedTokens" label={t('reversedTokens')} value={values.reversedTokens}
                            onChange={handleChange('reversedTokens')} className={classes.textField}
                            InputProps={{
                                  endAdornment: <InputAdornment  position="end">{values.symbol}</InputAdornment>
                            }}
                           margin="normal" type="number" variant="outlined"/>
                        <TextField required id="outlined-goal-required"
                            name="icoGoal" label={t('icoGoal')} value={values.goal}
                            onChange={handleChange('goal')} className={classes.textField}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">ETH</InputAdornment>
                            }}
                            margin="normal" type="float" variant="outlined"/>
                        <TextField required id="outlined-tokens-required"
                                name="icoTokens" label={t('icoTokens')} value={(values.tokens)}
                                onChange={handleChange('tokens')} className={classes.textField}
                                InputProps={{
                                     endAdornment: <InputAdornment position="end">{values.symbol}</InputAdornment>
                                }}
                               margin="normal" type="float" variant="outlined"/>
                         <TextField required id="outlined-timedelta-required" error
                                   name="icoPrice" label={t('icoPrice')} value={_calPrice()}
                                   className={classes.textField}
                                   InputProps={{
                                       readOnly: true,
                                       startAdornment:<InputAdornment style={{width:100}} position="start">{"1 ETH = "}</InputAdornment>,
                                       endAdornment: <InputAdornment  position="end">{values.symbol}</InputAdornment>
                                   }}
                         margin="normal" type="float" variant="outlined"/>
                        <TextField required id="outlined-timedelta-required"
                            name="icoTimedelta" label={t('icoTimedelta')} value={values.timedelta}
                            onChange={handleChange('timedelta')} className={classes.textField}
                            InputProps={{
                                 endAdornment: <InputAdornment position="end">{t('icoDays')}</InputAdornment>
                            }}
                           margin="normal" type="number" variant="outlined"/>
                </FormControl>
                <Button type="submit" variant="contained" disabled={!isValid} color="primary"
                    size="medium"
                    className={classes.submit}>
                        {t('create')}
                    </Button>

        </form>
        {snacks.show && <CustomSnackbar type={snacks.type} message = {snacks.message} pos= {snacks.pos} cb={hideSnack} cb2={snacks.cb2}/>}
    </>
   )
}

export default withRouter(CreateIco)
