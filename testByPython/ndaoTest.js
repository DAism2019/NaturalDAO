const ethers = require('ethers');
const fileService = require('../service/fileService');
const getProvider = require('../service/getProvider');
const network = 'http://127.0.0.1:8545';
const myAddress = "0x360466A41FF6617959c6b28516035a0581933F0C";
const contractAddress = '0x8731116550DAAa3acb8Be9389ce876EF347b362B';

async function test() {
    let abi = await fileService.readTxt('../abi/NDaoToken.json');
    let myProvider = getProvider(network);
    let contract = new ethers.Contract(contractAddress, abi, myProvider);
    let decimals = await contract.decimals();
    let name = await contract.name();
    let symbol = await contract.symbol();
    let balance = await contract.balanceOf(myAddress);
    balance = ethers.utils.formatEther(balance);
    console.log("代币名称:", name);
    console.log("代币符号:", symbol);
    console.log("代币精度:", decimals.toString());
    console.log("我的余额:", balance);
}

test();
