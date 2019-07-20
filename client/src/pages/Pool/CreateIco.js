import React, {useState, useEffect} from 'react'
import {withRouter} from 'react-router'
import {useWeb3Context} from 'web3-react'
import {ethers} from 'ethers'
import clsx from 'clsx';
import {makeStyles} from '@material-ui/core/styles';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import {useTranslation} from 'react-i18next'
import FormControl from '@material-ui/core/FormControl';
import InputAdornment from '@material-ui/core/InputAdornment';
import { Button } from '../../theme'
import styled from 'styled-components'

const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'column',
        alignItems: 'center',
        width: 550
    },
    textField: {
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1)
    },
    dense: {
        marginTop: theme.spacing(2)
    },
    menu: {
        width: 200
    },
    submit: {
        // itemAlign:'center',
        marginTop: theme.spacing(2),
        width: "50%"
    }
}));



const decimals = [12, 18];

function CreateIco({history, location}) {
    const {t} = useTranslation();
    const classes = useStyles();
    const { active, account,error } = useWeb3Context()
    const [values, setValues] = React.useState({
        name: '',
        symbol: '',
        decimals: 18,
        goal:'',
        timedelta:'',
        price:'',
        tokens:''
    });
    function _createIco(event){
        event.preventDefault();

    }

    function _calPrice(){
        let _goal = + values.goal;
        let _tokens = + values.tokens;
        if (Number.isNaN(_goal) || Number.isNaN(_tokens)){
            return 0;
        }else if ( _goal<= 0 || _tokens <= 0){
            return 0;
        }else{
            return (_tokens/_goal).toFixed(6);
        }
    }

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
                        <TextField required id="outlined-goal-required"
                            name="icoGoal" label={t('icoGoal')} value={values.goal}
                            onChange={handleChange('goal')} className={classes.textField}
                            InputProps={{
                                endAdornment: <InputAdornment position="end">ETH</InputAdornment>
                            }}
                            margin="normal" type="number" variant="outlined"/>
                        <TextField required id="outlined-tokens-required"
                                name="icoTokens" label={t('icoTokens')} value={values.tokens}
                                onChange={handleChange('tokens')} className={classes.textField}
                                InputProps={{
                                     endAdornment: <InputAdornment position="end">{values.symbol}</InputAdornment>
                                }}
                               margin="normal" type="number" variant="outlined"/>
                         <TextField required id="outlined-timedelta-required" error
                                   name="icoPrice" label={t('icoPrice')} value={_calPrice()}
                                   className={classes.textField}
                                   InputProps={{
                                       readOnly: true,
                                       startAdornment:<InputAdornment style={{width:100}} position="start">{"1 ETH = "}</InputAdornment>,
                                       endAdornment: <InputAdornment  position="end">{values.symbol}</InputAdornment>
                                   }}
                         margin="normal" type="number" variant="outlined"/>
                        <TextField required id="outlined-timedelta-required"
                            name="icoTimedelta" label={t('icoTimedelta')} value={values.timedelta}
                            onChange={handleChange('timedelta')} className={classes.textField}
                            InputProps={{
                                 endAdornment: <InputAdornment position="end">{t('icoDays')}</InputAdornment>
                            }}
                           margin="normal" type="number" variant="outlined"/>



                </FormControl>

                <Button type="submit" variant="contained" disabled={!isValid} color="primary" className={classes.submit}>
                        {t('create')}
                    </Button>

        </form>
    </>
   )
}

export default withRouter(CreateIco)
