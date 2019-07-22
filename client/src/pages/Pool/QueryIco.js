import React, {useState, useEffect} from 'react'
import {withRouter} from 'react-router'
import {useWeb3Context} from 'web3-react'
import {ethers} from 'ethers'
import {makeStyles} from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import {useTranslation} from 'react-i18next'
import FormControl from '@material-ui/core/FormControl'
import InputAdornment from '@material-ui/core/InputAdornment'
import Divider from '@material-ui/core/Divider'
import Button from '@material-ui/core/Button'
import SearchIcon from '@material-ui/icons/Search'
import Fab from '@material-ui/core/Fab'
import styled from 'styled-components'
import { isAddress } from '../../utils'
import { useFactoryContract } from '../../hooks'
import CustomSnackbar from '../../components/Snackbar'


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


function QueryIco({history, location}) {
    const {t} = useTranslation();
    const classes = useStyles();
    const { active, account,error } = useWeb3Context()
    const [values, setValues] = React.useState({
        creater: '',
        icoAddress: ''

    });
    const [snacks,setSnacks] =  React.useState({
        show: false,
        type: 'success',
        pos:"center",
        message:''

    });
    const contract = useFactoryContract()
    async function _queryIcoByCreater(event){
        event.preventDefault();
        if (!isAddress(values.creater)){
            return setSnacks({
                 show:true,
                 type:"error",
                 message:t('invalidAddress'),
                 pos:"left"

             })
        }else{
            let amount = await contract.allIcoCountsOfUser(values.creater);
            console.log( + amount);
        }

    }
    async function _queryIco(event){
        event.preventDefault();
        if (!isAddress(values.icoAddress)){
            return setSnacks({
                 show:true,
                 type:"error",
                 message:t('invalidAddress'),
                 pos:"left"

             })
        }else{
           let status = await contract.allIcoStatus(values.icoAddress);
           status = + status;
           if (status == 0){
               return setSnacks({
                    show:true,
                    type:"error",
                    message:t('ico_not_exist'),
                    pos:"left"

                })
           }else{
               history.push("/ico-detail/" + values.icoAddress);
           }
        }
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
    function hideSnack(){
        setSnacks({
            show:false,
            message:'',
            type:""
        })
    }

    const handleChange = name => event => {
        setValues({
            ...values,
            [name]: event.target.value
        });
    };
    return (
        <>
            <form className = {classes.container}  onSubmit={_queryIco} name="address"   autoComplete = "off" >
                <FormControl margin="normal" required fullWidth style={{ alignItems: 'center'}}>
                       <TextField required fullWidth id="outlined-icoAddress-required"
                           label={t('queryByIco')} value={values.icoAddress}
                           onChange={handleChange('icoAddress')} className={classes.textField}
                           margin="normal" type="string" variant="outlined"/>
                          {createBtn(classes)}
                      </FormControl>
                  </form>
                      <form className = {classes.container}  onSubmit={_queryIcoByCreater} name="creater"   autoComplete = "off" >
                          <FormControl margin="normal" required fullWidth style={{ alignItems: 'center'}}>
                   <TextField required  fullWidth id="outlined-creater-required"
                       label={t('queryByCreater')} value={values.creater}
                       onChange={handleChange('creater')} className={classes.textField}
                       margin="normal" type="string" variant="outlined"/>
                       {createBtn(classes)}
                   </FormControl>
               </form>
            {snacks.show && <CustomSnackbar type={snacks.type} message = {snacks.message} pos= {snacks.pos} cb={hideSnack}/>}
            <Divider />

    </>
   )
}

export default withRouter(QueryIco)
