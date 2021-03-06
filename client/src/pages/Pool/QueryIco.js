import React from 'react'
import {withRouter} from 'react-router'
import {makeStyles} from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import {useTranslation} from 'react-i18next'
import FormControl from '@material-ui/core/FormControl'
import Divider from '@material-ui/core/Divider'
import SearchIcon from '@material-ui/icons/Search'
import Fab from '@material-ui/core/Fab'
import { isAddress  } from '../../utils'
import { useFactoryContract } from '../../hooks'
import CustomSnackbar from '../../components/Snackbar'
import CustomTable from '../../components/CustomTable'
import { isMobile } from 'react-device-detect'

let oldInfos = []


const useStyles = makeStyles(theme => ({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: theme.spacing(-3),
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
    let headData = [t('ico_address'),t('symbol'),t('status')];
    const classes = useStyles();
    const [values, setValues] = React.useState({
        creater: '',
        icoAddress: ''
    });
    //这里使用一个useEffect，根据账号来判断是否显示
    const [bodyData,setBodyData] = React.useState(oldInfos);
    const [showTable,setShowTable] = React.useState(oldInfos.length > 0);
    const [snacks,setSnacks] =  React.useState({
        show: false,
        type: 'success',
        pos:"left",
        message:''
    });
    const contract = useFactoryContract();
    async function _queryIcoByCreater(event){
        event.preventDefault();
        setShowTable(false);
        setValues({
            ...values,
            icoAddress:''
        });
        if (!isAddress(values.creater)){
            setSnacks({
                 show:true,
                 type:"error",
                 message:t('invalidAddress'),
                 pos:"left"

             });
        }else{
            let amount = await contract.allIcoCountsOfUser(values.creater);
            amount = + amount;
            if(amount <= 0){
                oldInfos = []
                setSnacks({
                    show: true,
                    type: 'info',
                    pos:"left",
                    message:t("ico_not_find")
                });
            }else{
                //Vyper没法返回一次性所需的所有值，必须遍历
                //可以试下Promise.all 进行优化
                let allAddress = await contract.getAllIcoOfUser(values.creater);
                let allPromise = [];
                for(let i = 0;i < amount;i++){
                    let _address = allAddress[i];
                    allPromise.push(contract.getShortInfoByIcoAddress(_address).catch(() => null))
                }
                Promise.all(allPromise).then(result =>{
                    let allInfos = []
                    for(let _result of result){
                        allInfos.push([_result[0],_result[1],t(_calStatus(+ _result[2]))])
                    }
                    setBodyData(allInfos);
                    oldInfos = allInfos;
                    setShowTable(true);
                });
                // data.push([_address,_symbol,t(_calStatus(+ _status))]);
                // setBodyData(data);
                // setShowTable(true);
            }
        }
    }

    function _calStatus(status){
        let str = ''
        switch (status) {
            case 2:
                str = 'STATUS_SUCCESS';
                break;
            case 3:
                str = 'STATUS_FAILED';
                break;
            case 1:
                str = 'STATUS_STARTED';
                break;
            case 0:
            default:
                str = 'STATUS_NONE';
                break;
        }
        return str;
    }

    async function _queryIco(event){
        event.preventDefault();
        setShowTable(false);
        setValues({
            ...values,
            creater: ""
        });
        if (!isAddress(values.icoAddress)){
            return setSnacks({
                 show:true,
                 type:"error",
                 message:t('invalidAddress'),
                 pos:"left"

             });
        }else{
           let status = await contract.allIcoStatus(values.icoAddress);
           status = + status;
           if (status === 0){
               return setSnacks({
                    show:true,
                    type:"error",
                    message:t('ico_not_exist'),
                    pos:"left"

                });
           }else{
               // oldInfos = []
               history.push("/ico-detail#" + values.icoAddress);
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
                style={{width:isMobile ? "50%":"30%"}}
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
            {showTable && <CustomTable headData={headData} bodyData={bodyData} style={{width:"100%"}} /> }

    </>
   )
}

export default withRouter(QueryIco)
