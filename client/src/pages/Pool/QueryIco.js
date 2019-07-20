import React, {useState, useEffect} from 'react'
import {withRouter} from 'react-router'
import {useWeb3Context} from 'web3-react'
import {ethers} from 'ethers'
import {makeStyles} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import {useTranslation} from 'react-i18next'
import FormControl from '@material-ui/core/FormControl';
import InputAdornment from '@material-ui/core/InputAdornment';
import Divider from '@material-ui/core/Divider';
import Button from '@material-ui/core/Button';
import SearchIcon from '@material-ui/icons/Search';
import Fab from '@material-ui/core/Fab';
import styled from 'styled-components'
import { useFactoryContract } from '../../hooks'


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
    margin: {
        margin: theme.spacing(1),
    },
    extendedIcon: {
        marginRight: theme.spacing(1),
    },
    submit: {
        // itemAlign:'center',
        margin: theme.spacing(1),
        backgroundColor: '#007bff'
    }
}));


const decimals = [12, 18];
const GAS_MARGIN = ethers.utils.bigNumberify(1000);
function QueryIco({history, location}) {
    const {t} = useTranslation();
    const classes = useStyles();
    const { active, account,error } = useWeb3Context()
    const [values, setValues] = React.useState({
        creater: '',
        icoAddress: ''

    });
    const contract = useFactoryContract()
    async function _queryIco(event){
        event.preventDefault();
    }
    function createBtn(classes){
        return (
            <Fab
                variant="extended"
                size="medium"
                color="primary"
                aria-label="Add"
                className={classes.submit}
                type = 'submit'
                style={{width:"30%"}}
            >
                <SearchIcon className={classes.extendedIcon} />
                {t('query')}
            </Fab>
        )
    }

    const handleChange = name => event => {
        setValues({
            ...values,
            [name]: event.target.value
        });
    };
    return (
        <>
            <form className = {classes.container}  onSubmit={_queryIco} name="address" noValidate  autoComplete = "off" >
                <FormControl margin="normal" required fullWidth style={{ alignItems: 'center'}}>
                       <TextField required fullWidth id="outlined-icoAddress-required"
                           label={t('queryByIco')} value={values.icoAddress}
                           onChange={handleChange('icoAddress')} className={classes.textField}
                           margin="normal" type="string" variant="outlined"/>
                          {createBtn(classes)}
                      </FormControl>
                  </form>
                      <form className = {classes.container}  onSubmit={_queryIco} name="creater" noValidate  autoComplete = "off" >
                          <FormControl margin="normal" required fullWidth style={{ alignItems: 'center'}}>
                   <TextField required  fullWidth id="outlined-creater-required"
                       label={t('queryByCreater')} value={values.creater}
                       onChange={handleChange('creater')} className={classes.textField}
                       margin="normal" type="string" variant="outlined"/>
                       {createBtn(classes)}
                   </FormControl>
               </form>
            <Divider />
    </>
   )
}

export default withRouter(QueryIco)
