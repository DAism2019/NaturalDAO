//仅限本工程使用，不能通用
const ethers = require('ethers');
const request = require('request');
const fileService = require('./fileService');
const etherscanProvider = new ethers.providers.EtherscanProvider();


let util = {
    priceContract: null, //价格合约
    network: null, //网络
    wallet: null, //钱包，用来写入合约
    //初始化
    init: (network, myPrivateKey) => {
        util.network = network;
        let provider = util.getProvider(network);
        util.wallet = new ethers.Wallet(myPrivateKey, provider);
    },
    //初始化provider,Rinkeby目前未测试
    getProvider: (network) => {
        let _myProvider = null;
        switch (network) {
            case 'localhost':
                _myProvider = new ethers.providers.JsonRpcProvider();
                break;
            case 'homestead':
            case 'kovan':
            case 'ropsten':
                _myProvider = ethers.getDefaultProvider(network);
                break;
            default:
                //http://domain.com:8545
                _myProvider = new ethers.providers.JsonRpcProvider(network);
                break;
        }
        return _myProvider
    },
    //http请求工具,需要返回的是json
    doRequest: async options => {
        return new Promise((resolve, reject) => {
            try {
                request(options, function(error, response, body) {
                    try {
                        if (error) {
                            reject(error);
                        } else if (response.statusCode == 200) {
                            const info = JSON.parse(body);
                            resolve(info);
                        } else {
                            reject(response.body);
                        }
                    } catch (err) {
                        console.log(err);
                    }
                });
            } catch (err2) {
                console.log(err2);
            }
        });
    },
    //价格转换 todo 优化选项:这里精度太高会超过js的处理能力，需要转成bigNumber进行处理
    convertPrice:  price => {
        try {
            let _str = price.toString();
            let _strs = _str.split('.');
            let _des = _strs.length > 1
                ? _strs[1].length
                : 0;
            let priceTimes = parseInt(price * Math.pow(10, _des));
            let weis = ethers.utils.parseEther('1.0');
            let _result = weis.mul(Math.pow(10, _des)).div(100).div(priceTimes);
            return _result;
        } catch (err) {
            console.log("对ETH价格进行转换错误:", err);
            return null
        }
    },
    //方法1，使用ether自带查询 精度只有2位 例如309.33
    queryPrice1: async () => {
        try {
            let price = await etherscanProvider.getEtherPrice();
            price = + (price.toString());
            return price;
        } catch (err) {
            console.log("err:", err);
            return null
        }

    },
    //方法2 查询coinbase接口，精度8位,实际使用2位
    queryPrice2: async () => {
        let options = {
            url: "https://api.pro.coinbase.com/products/ETH-USD/ticker",
            method: 'GET',
            headers: {
                'user-agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
            }
        };
        try {
            let result = await util.doRequest(options);
            price = + result.price;
            console.log("price:",price);
            return price;
        } catch (err) {
            console.log("err:", err);
            return null
        }
    },
    //注意：server端调用和直接工程要目录调用的相对路径不同
    //获取价格合约
    getPriceContract: async (address, isProject) => {
        if (!util.priceContract) {
            let _file = isProject
                ? './abi/MyFiat.json'
                : '../abi/MyFiat.json';
            let abi = await fileService.readJson(_file);
            util.priceContract = new ethers.Contract(address, abi, util.wallet);
        }
        return util.priceContract;
    },
    //这里的price是美元，最后要转化为0.01$对应的wei数量
    //写入价格合约
    writeContract: async (address, price, isProject) => {
        let result = util.convertPrice(price);
        if (!result || result < 0)
            return console.log("ETH价格获取失败");
        try {
            let contract = await util.getPriceContract(address, isProject);
            let tx = await contract.setPrice(result);
            await tx.wait();
            console.log("The price of ETH is update to $", price);
        } catch (err) {
            console.log("ETH价格获写入合约错误:", err);
        }
    },
    watchUpdate:async(address)=>{
        try{
            let contract = await util.getPriceContract(address);
            contract.on("requestUpdate", async (id, event) => {
                let price = await util.queryPrice1();
                util.writeContract(address, price, false);
            });
        }catch(err){
            console.log(err);
        }
    }
}

module.exports = util;
