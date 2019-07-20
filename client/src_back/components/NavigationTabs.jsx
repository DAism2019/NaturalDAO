import React,{useState,useCallback}from 'react';
import Paper from '@material-ui/core/Paper';
import {makeStyles} from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SendIcon from '@material-ui/icons/Send';
import SwapIcon from '@material-ui/icons/SwapHoriz';
import IcoIcon from '@material-ui/icons/MonetizationOn';
import {withRouter} from "react-router-dom";

const useStyles = makeStyles({
    root: {
        // flexGrow: 1,
        maxWidth: 600,
        width: 600
    }
});

//todo 要修改以后加入 ICO详情时修改 匹配正则表达式
function calValue(pathname) {
    if (pathname === '/comments')
        return 1;
    else if (pathname === '/contact')
        return 2;
    else
        return 0;
    }

//todo 要修改，以后加入ICO详情时修改 匹配正则表达式
function calStr(newValue) {
    let str = newValue === 0
        ? "/swap"
        : newValue === 1
            ? "/comments"
            : "contact"
    return str;
}

//方法也许不对，路由是不是重新加载
function IconLabelTabs({ location: { pathname }, history }) {
    const classes = useStyles();
    let [value, setValue] = useState(0);
    value = calValue(pathname);
    function handleChange(event, newValue) {
        // setValue(newValue);
        history.push(calStr(newValue));

    }
    return (
        <div>
        <Paper square className={classes.root}>
            <Tabs value={value} onChange={handleChange} variant="fullWidth" indicatorColor="secondary" textColor="secondary">
                <Tab icon={<SwapIcon />} label="Swap"/>
                <Tab icon={<SendIcon />} label="Send"/>
                <Tab icon={<IcoIcon />} label="Ico"/>
            </Tabs>
        </Paper>
    </div>);
}

export default withRouter(IconLabelTabs)
