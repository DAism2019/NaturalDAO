import React, {Component} from 'react';
import {withStyles} from '@material-ui/core/styles';
// import PropTypes from 'prop-types';

function calTime(allSeconds) {
    if (allSeconds <= 0)
        allSeconds = 0;
    allSeconds = parseInt(allSeconds)
    let _h = Math.floor(allSeconds / 3600);
    let _leave1 = allSeconds - _h * 3600;
    let _m = Math.floor(_leave1 / 60);
    let _s = _leave1 - _m * 60;
    let _str = "" + (
        _h < 10
        ? "0" + _h
        : _h) + ":" + (
        _m < 10
        ? "0" + _m
        : _m) + ":" + (
        _s < 10
        ? "0" + _s
        : _s);
    return _str;
}

class CountDownLabel extends Component {
    timer = 0
    constructor(props) {
        super(props);
        this.state = {
            maxTime: this.props.maxTime,
            curTime: this.props.maxTime,
            timeStr: "12:00:00",
            label: this.props.label || "",
            color: this.props.color || "#333333",
            sstr: this.props.sstr || "s",
            fontSize: this.props.fontSize || 18,
            cb:this.props.cb
        }
    }
    componentDidMount() {
        this.setState({
            timeStr: this.state.curTime > 60
                ? calTime(this.state.curTime)
                : this.state.curTime
        })
        if(this.state.curTime <= 0)
            return;
        this.timer = setInterval(() => {
            var curTime = this.state.curTime -1;
            this.setState({
                timeStr: curTime <= 60
                    ? curTime
                    : calTime(curTime)
            })
            if (curTime <= 0) {
                clearInterval(this.timer);
                if(curTime ===0 ){
                    this.setState({curTime});
                    if(this.state.cb){
                        this.state.cb()
                    }
                }
                // CountDownLabel.onOver.dispatch();
            } else {
                // CountDownLabel.onTime.dispatch(curTime);
                this.setState({curTime});
            }
        }, 1000);
    }
    componentWillUnmount() {
        clearInterval(this.timer);
    }
    render() {
        // const {classes} = this.props;
        var CountDownLabel = {
            fontSize: this.state.fontSize,
            fontWeight:700,
            color: this.state.color,
        }
        return (<div style={CountDownLabel}>
            {this.state.label + " " + this.state.timeStr + this.state.sstr}
        </div>);
    }
}

const styles = theme => ({});

export default withStyles(styles)(CountDownLabel);
