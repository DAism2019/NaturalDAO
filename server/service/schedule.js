const Schedule = require('node-schedule');
const ethers = require('ethers');
const request = require('request');
const abi = require('../abi/MyFiatAbi');
const contractAddress = '0x7039DEFcB285b9d3F13E48e16ceD444272fee606';

let ruleQueryPrice;
let etherscanProvider;
let contract;

function init() {
    etherscanProvider = new ethers.providers.EtherscanProvider();
    ruleQueryPrice = new Schedule.RecurrenceRule();
    ruleQueryPrice.second = 0;
    ruleQueryPrice.minute = 0;
    let network = process.env.NET_WORK;
    let myProvider = getProvider(network);
    let myPrivateKey = process.env.PRIVATE_KEY_MAINNET;
    let myWallet = new ethers.Wallet(myPrivateKey, myProvider);
    contract = new ethers.Contract(contractAddress,abi,myWallet);

}

function start() {
    init();
    console.log("开始查询ETH价格......");
    queryPrice1();
    Schedule.scheduleJob(ruleQueryPrice, () => {
        queryPrice1()
    });
}

//方法1，使用ether自带查询 精度只有2位 309.33
async function queryPrice1() {
    try{
        let price = await etherscanProvider.getEtherPrice();
        price =  + (price.toString());
        writeContract(price);
    }catch(err){
        console.log("err:",err);
    }

}

//方法2 查询coinbase接口
async function queryPrice2() {
    let options = {
        url: "https://api.pro.coinbase.com/products/ETH-USD/ticker",
        method: 'GET'
    };
    try{
         let result = await doRequest(options);
         price = + result.price;
         writeContract(price);
    }catch(err){
        console.log("err:",err);
    }
}


//这里的price是美元，最后要转化为0.01$对应的wei数量
async function writeContract(price){
    let result = convertPrice(price);
    if(!result || result < 0)
        return;
    try{
        console.log("当前ETH价格为:",price)
        let tx = await contract.setPrice(result);
        console.log("交易已经成功发送,哈希值为:",tx.hash);
    }catch(err){
        console.log("写入合约错误:",err);
    }

}

//http请求工具
async function doRequest(options) {
    return new Promise((resolve, reject) => {
        try{
            request(options, function(error, response, body) {
                try{
                    if (error) {
                        reject(error);
                    } else if (response.statusCode == 200) {
                        const info = JSON.parse(body);
                        resolve(info);
                    } else {
                        reject(response.body);
                    }
                }catch(err){
                    console.log(options);
                    console.log(err);
                }
            });
        }catch(err2){
            console.log(err2);
        }
    });
}


function convertPrice(price) {
    try{
        let _str = price.toString();
        let _strs = _str.split('.');
        let _des = _strs.length > 1 ? _strs[1].length : 0;
        let priceTimes = parseInt(price * Math.pow(10,_des));
        let weis = ethers.utils.parseEther('1.0');
        let _result = weis.mul(Math.pow(10,_des)).mul(100).div(priceTimes);
        return _result;
    }catch(err){
        console.log("对ETH价格进行转换错误:",err);
    }

}

function getProvider(network) {
    let _myProvider = null;
    switch (network) {
        case 'localhost':
            _myProvider = new ethers.providers.JsonRpcProvider(); //本地测试
            break;
        case 'homestead':
        case 'kovan':
        case 'ropsten':
            _myProvider = ethers.getDefaultProvider(network);
            break;
        default:
            _myProvider = new ethers.providers.JsonRpcProvider(network);
            break;
    }
    return _myProvider
}


module.exports = start;
