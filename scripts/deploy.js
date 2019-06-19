/*************************************************
  Copyright (C),2018-2022
  Filename:  deploy.js
  Author: zhanghua     Version:   1.0     Date: 2019.06.02
  Description:  此JS是使用node.js脚本自动部署Vper合约
                所需要的私钥和网络配置在.env中
                目前只能处理单一合约的情况
                需要node.js 7.6以上
  email:radarzhhua@gmail.com
  qq:316855125
*************************************************/

//导入模块
const ethers = require('ethers');
const fileService = require('../service/fileService');
//定义相关文件位置
let abiPath = 'abi';
let bytecodePath = 'bytecode';
let contractPath = 'contract';

//定义ethers框架相关变量
let myProvider,
    myWallet,
    myPrivateKey,
    factory;

/**
* 初始化区块链相关内容
* @param filename 文件名
*/
async function init(filename) {
    let bytecode = await readByteCode(filename);
    let abi = await readAbi(filename);
    let network = process.env.NET_WORK;
    myProvider = getProvider(network);
    let myPrivateKey = process.env.PRIVATE_KEY_MAINNET;
    myWallet = new ethers.Wallet(myPrivateKey, myProvider);
    factory = new ethers.ContractFactory(abi, bytecode, myWallet);
}

/**
* 获得文件名，不包含后缀
* @param filename 文件名
* @return 文件名（不包括后缀）
*/
function getFilePre(filename) {
    let filenames = filename.split('.');
    return filenames[0];
}

/**
* 读取相应的字节码
* @param filename 文件名（不包括后缀）
* @return 字节码
*/
async function readByteCode(filename) {
    let bytecodeFile = bytecodePath + "/" + getFilePre(filename) + ".txt";
    let bytecode = await fileService.readTxt(bytecodeFile);
    return bytecode;
}

/**
* 读取相应的ABI
* @param filename 文件名（不包括后缀）
*/
async function readAbi(filename) {
    let abiFile = abiPath + "/" + getFilePre(filename) + ".json";
    let abi = await fileService.readTxt(abiFile);
    return abi;
}

/**
* 部署合约
* @param constructor 构造器参数
* @return ABI字符串
*/
async function deploy(constructor,filename) {
    //开始部署进程
    try {
        console.log(`start deploying \x1b[31m ${filename}\x1b[0m,my address is \x1b[32m${myWallet.address}\x1b[0m`);
        let contract = await factory.deploy(...constructor);
        console.log(`\x1b[31mcontract.address:\x1b[32m${contract.address}\x1b[0m`);
        console.log(`\x1b[31mcontract.deployTransaction.hash:\x1b[32m${contract.deployTransaction.hash}\x1b[0m`);
        await contract.deployed();
        console.log(`Congratulation! The contract is deployed on \x1b[32m${process.env.NET_WORK}.\x1b[0m`)
    } catch (err) {
        console.log("deploy error:", err);
    }

}

/**
* begin work
* @params filename 文件名
* @params constructor 构造器参数
*/
async function begin(filename, constructor) {
    await init(filename);
    deploy(constructor,filename);
}

function getProvider(network){
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


//程序入口,检测输入的文件名和构造器参数
function start() {
    if (process.argv.length > 2) {
        let filename = process.argv[2];
        let constructor = [];
        for (let i = 3; i < process.argv.length; i++) {
            constructor.push(process.argv[i]);
        }
        begin(filename, constructor);
    } else {
        process.stdout.write("Enter a filename for deploy:");
        process.stdin.resume();
        process.stdin.once("data", function(data) {
            process.stdin.pause();
            let filename = data.toString().trim();
            let _names = filename.split(' ');
            let constructor = [];
            for (let i = 1; i < _names.length; i++) {
                constructor.push(_names[i]);
            }
            begin(filename, constructor);
        });
    }
}

start();
