import React, {useState} from 'react';
import Paper from '@material-ui/core/Paper';
import {makeStyles} from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SendIcon from '@material-ui/icons/Send';
import SwapIcon from '@material-ui/icons/SwapHoriz';
import IcoIcon from '@material-ui/icons/MonetizationOn';
import {withRouter} from "react-router-dom";
import {useTranslation} from 'react-i18next'

const useStyles = makeStyles({
    root: {
        // flexGrow: 1,
        maxWidth: 550,
        marginLeft: 5,
        marginBottom: 5,
        width: 550
    }
});

const allPaths = [/\/swap/, /\/send/, /\/create-ico|\/query-ico|\/ico-detail.*/];

// 要修改以后加入 ICO详情时修改 匹配正则表达式
function calValue(pathname) {
    let index = allPaths.findIndex(regex => pathname.match(regex));
    if (index <= 0)
        index = 0
    return index
}


function calStr(newValue) {
    let str = newValue === 0
        ? "/swap"
        : newValue === 1
            ? "/send"
            : "/create-ico"
    return str;
}

//方法也许不对，路由是不是重新加载
function IconLabelTabs({location: {
        pathname
    }, history}) {
    const classes = useStyles();
    const {t} = useTranslation()
    let [value, ] = useState(0);
    value = calValue(pathname);
    function handleChange(event, newValue) {
        // setValue(newValue);
        history.push(calStr(newValue));

    }
    return (<div>
        <Paper square className={classes.root}>
            <Tabs value={value} onChange={handleChange} variant="fullWidth" indicatorColor="secondary" textColor="secondary">
                <Tab icon={<SwapIcon />} label={t("swap")}/>
                <Tab icon={<SendIcon />} label={t("send")}/>
                <Tab icon={<IcoIcon />} label={t("Ico")}/>
            </Tabs>
        </Paper>
    </div>);
}

export default withRouter(IconLabelTabs)
