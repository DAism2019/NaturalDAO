const ethers = require('ethers');
const fileService = require('./fileService');
const etherscanProvider = new ethers.providers.EtherscanProvider();
let util = {
    priceContract: null,
    network: null,
    // provider:null,
    wallet:null,
    init: (network,myPrivateKey) => {
        util.network = network;
        let provider = util.getProvider(network);
        util.wallet =  new ethers.Wallet(myPrivateKey, provider);
    },
    getProvider: (network) => {
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
    },
    //http请求工具,需要提前知道返回的是json
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
    convertPrice: async price => {
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
        }
    },
    //方法1，使用ether自带查询 精度只有2位 309.33
    queryPrice1: async () => {
        try {
            let price = await etherscanProvider.getEtherPrice();
            price = + (price.toString());
            return price;
        } catch (err) {
            console.log("err:", err);
        }

    },
    //方法2 查询coinbase接口
    queryPrice2: async () => {
        let options = {
            url: "https://api.pro.coinbase.com/products/ETH-USD/ticker",
            method: 'GET'
        };
        try {
            let result = await util.doRequest(options);
            price = + result.price;
            return price;
        } catch (err) {
            console.log("err:", err);
        }
    },
    getPriceContract: async (address,isProject) => {
        if (!util.priceContract) {
            let _file = isProject ? './abi/MyFiat.json' : '../abi/MyFiat.json';
            let abi = await fileService.readJson(_file);
            util.priceContract = new ethers.Contract(address,abi,util.wallet);
        }
        return util.priceContract;
    },
    //这里的price是美元，最后要转化为0.01$对应的wei数量
    writeContract: async (address, price,isProject) => {
        let result = util.convertPrice(price);
        if (!result || result < 0)
            return;
        try {
            let contract = await util.getPriceContract(address,isProject);
            let tx = await contract.setPrice(result);
            await tx.wait();
            console.log("The price of ETH is update to $",price);
        } catch (err) {
            console.log("写入合约错误:", err);
        }
    }
}

module.exports = util;
