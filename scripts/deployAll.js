//一次性部署并设置我们该项目所有的合约

/*************************************************
  Copyright (C),2018-2022
  Filename:  deploy.js
  Author: zhanghua     Version:   1.0     Date: 2019.06.02
  Description:  此JS是使用node.js脚本自动部署Vper合约
                所需要的私钥和网络配置在.env中
                需要node.js 7.6以上
  email:radarzhhua@gmail.com
  qq:316855125
*************************************************/

//导入模块
const ethers = require('ethers');
const fileService = require('../service/fileService');
const util = require('../service/utilService');
//定义相关文件位置
let abiPath = 'abi';
let bytecodePath = 'bytecode';
let contractPath = 'contract';
let addressPath = 'address'
//定义ethers框架相关变量
let myWallet,factory;

let allAbi = {};
let allBytecode = {};
let allAddress = {}

function initWallet(){
    let network = process.env.NET_WORK;
    let myPrivateKey = process.env.PRIVATE_KEY_MAINNET;
    util.init(network,myPrivateKey);
    myWallet = util.wallet;
}

/**
* 初始化区块链相关内容
* @param filename 文件名
*/
async function init(filename) {
    let bytecode = await readByteCode(filename);
    allBytecode[filename] = bytecode;
    let abi = await readAbi(filename);
    allAbi[filename] = abi;
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
async function deploy(filename,constructor) {
    if(!constructor)
        constructor = [];
    //开始部署进程
    try {
        console.log(`start deploying \x1b[35m ${filename}\x1b[0m`);
        let contract = await factory.deploy(...constructor);
        console.log(`\x1b[35mcontract.address:\x1b[32m${contract.address}\x1b[0m`);
        console.log(`\x1b[35mcontract.deployTransaction.hash:\x1b[32m${contract.deployTransaction.hash}\x1b[0m`);
        // console.log('waiting ........');
        await contract.deployed();
        console.log(`Congratulation! The contract is deployed on \x1b[32m${process.env.NET_WORK}.\x1b[0m`)
        allAddress[filename] = contract.address;
        console.log("------------------------------------------------------------------------------------------------")
    } catch (err) {
        console.log("deploy error:", err);
    }
}

/**
* begin work
* @params filename 文件名
* @params constructor 构造器参数
*/
async function beginDeploy(filename, constructor) {
    await init(filename);
    await deploy(filename,constructor);
}



function  saveAddress() {
    let _file = addressPath + '/address.json';
    fileService.writeJson(_file, allAddress);
}


//程序入口,检测输入的文件名和构造器参数
async function start() {
    initWallet();
    console.log(`Begin deploying! My address is \x1b[32m${myWallet.address}\x1b[0m`);
    await beginDeploy('Factory.py');
    await beginDeploy('NDAOToken.py',[allAddress['Factory.py']]);
    await beginDeploy('Ico.py');
    await beginDeploy('Exchange.py');
    await beginDeploy('EthPrice.py');
    await beginDeploy('MyFiat.py');
    console.log(`\x1b[32mall contracts deploy over!\x1b[0m`)
    saveAddress();
    setContract();
}



async function setContract(){
    //设置EthPrice
    let filename = 'EthPrice.py'
    let contract = new ethers.Contract(allAddress[filename],allAbi[filename],myWallet);
    console.log(`Start setup:${filename}`)
    let tx = await contract.setFiator(allAddress['MyFiat.py']);
    await tx.wait();
    filename = 'Factory.py'
    contract = new ethers.Contract(allAddress[filename],allAbi[filename],myWallet);
    console.log(`Start setup:${filename}`)
    tx = await contract.initializeFactory(
        allAddress['Exchange.py'],
        myWallet.address,
        allAddress['NDAOToken.py'],
        allAddress['EthPrice.py'],
        allAddress['Ico.py'],
    );
    await tx.wait();
    console.log(`\x1b[32mall contracts setup over!\x1b[0m`)
    let price = await util.queryPrice1();
    util.writeContract(allAddress['MyFiat.py'],price,true);
}


start();
