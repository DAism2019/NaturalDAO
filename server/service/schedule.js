//用来每隔一个小时查询ETH价格并写入自定义的价格合约
const Schedule = require('node-schedule');
const util = require('./utilService');
const fileService = require('./fileService');
let ruleQueryPrice;

function init() {
    ruleQueryPrice = new Schedule.RecurrenceRule();
    ruleQueryPrice.second = 0;
    ruleQueryPrice.minute = 0;
    let network = process.env.NET_WORK;
    let myPrivateKey = process.env.PRIVATE_KEY_MAINNET;
    util.init(network, myPrivateKey);
}

async function start() {
    init();
    let allAddress = await fileService.readJson('../address/address.json');
    let address = allAddress['MyFiat.py'];
    console.log("Begin query the price of ETH......");
    updatePrice(address);
    Schedule.scheduleJob(ruleQueryPrice, () => {
        updatePrice(address);
    });

}

async function updatePrice(address) {
    let price = await util.queryPrice2();
    util.writeContract(address, price, false);
}

module.exports = start;
