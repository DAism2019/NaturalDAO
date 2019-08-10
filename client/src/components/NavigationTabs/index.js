import React, {useState,useEffect} from 'react';
import Paper from '@material-ui/core/Paper';
import {makeStyles} from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SendIcon from '@material-ui/icons/Send';
import SwapIcon from '@material-ui/icons/SwapHoriz';
import IcoIcon from '@material-ui/icons/MonetizationOn';
import {withRouter} from "react-router-dom";
import {useTranslation} from 'react-i18next'

const useStyles = makeStyles( theme =>({
    root: {
        flexGrow: 1,
    },
    tabs:{
        marginBottom:theme.spacing(3)
    }
}));

const allPaths = [ /\/create-ico|\/query-ico|\/ico-detail.*/,/\/swap/, /\/send/];

// 要修改以后加入 ICO详情时修改 匹配正则表达式
function calValue(pathname) {
    let index = allPaths.findIndex(regex => pathname.match(regex));
    if (index < 0)
        index = 1
    return index
}


function calStr(newValue) {
    let str = newValue === 0
        ? "/create-ico"
        : newValue === 1
            ? "/swap"
            : "/send"
    return str;
}

//方法也许不对，路由是不是重新加载
function IconLabelTabs({location: {
        pathname
    }, history}) {
    const classes = useStyles();
    const {t} = useTranslation()
    const [value,setValue] = useState(1);
    function handleChange(event, newValue) {
        // setValue(newValue);
        history.push(calStr(newValue));

    }
    useEffect(()=>{
        setValue(calValue(pathname))
    },[pathname])
    return (<div>
        <Paper square className={classes.root}>
            <Tabs value={value} onChange={handleChange}
                variant="fullWidth"
                centered
                className ={classes.tabs}
                indicatorColor="secondary" textColor="secondary">
                <Tab icon={<IcoIcon />} label={t("Ico")}/>
                <Tab icon={<SwapIcon />} label={t("swap")}/>
                <Tab icon={<SendIcon />} label={t("send")}/>
            </Tabs>
        </Paper>
    </div>);
}

export default withRouter(IconLabelTabs)
