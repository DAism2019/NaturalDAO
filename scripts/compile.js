/*************************************************
  Copyright (C),2018-2022
  Filename:  compile.js
  Author: zhanghua     Version:   1.0     Date: 2019.06.02
  Description:  此JS是使用node.js脚本编译Vyper合约并保存在对应的文件中
                目前只能处理单一合约的情况
                需要node.js 7.6以上
  email:radarzhhua@gmail.com
  qq:316855125
*************************************************/
//读写文件操作库
const fileService = require('../service/fileService');
//定义相关路径
let abiPath = 'abi';
let bytecodePath = 'bytecode';
let contractPath = 'contracts';
//字义子进程
let spawn = require("child_process").spawn;
//定义缓冲区大小，可能不同系统不一样，这里可以进一步优化
let MAX_SIZE = 8192;
// let WORK_DIR = '..'; 默认当前工作路径

/**
* 编译文件并处理编译输出
* @param filename 文件名，这里不需要加上"contract/"，会自动加上
*/
function compile(filename) {
    let _file = contractPath + "/" + filename;
    let _params = ['-f', 'abi,bytecode', _file];
    let cp = spawn("vyper", _params);
    let _data = "";
    cp.stdout.on('data', (data) => {
        _data += data;
        // console.log(`buffer size is :${data.length}`);
        if (data.length < MAX_SIZE)
            dealData(filename, _data.toString());
        }
    );
    cp.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
        console.log(`\x1b[31mCompile ${filename} Failed!\x1b[0m`);
    });
    cp.on('close', (code) => {
        console.log(`exit：${code}`);
    });
}

/**
* 处理缓冲区数据
* @param filename 文件名
* @param data 缓冲区数据
*/
function dealData(filename, data) {
    let _files = filename.split('.');
    let datas = data.split('\n');
    saveAbi(_files[0], datas[0]);
    saveBytecode(_files[0], datas[1]);
    console.log(`\x1b[32mCompile ${filename} Success!\x1b[0m`)
}

/**
* 保存abi到对应的文件
* @param filename 文件名
* @param data abi数据
*/
function saveAbi(file, data) {
    let _file = abiPath + "/" + file + '.json';
    fileService.writeTxt(_file, data);
}

/**
* 保存字节码到对应的文件
* @param filename 文件名
* @param data bytecode数据
*/
function saveBytecode(file, data) {
    let _file = bytecodePath + "/" + file + '.txt';
    fileService.writeTxt(_file, data);
}

//程序入口，检测输入
function start() {
    if (process.argv.length > 2) {
        let filename = process.argv[2];
        compile(filename);
    } else {
        process.stdout.write("Enter a filename for compile:");
        process.stdin.resume();
        process.stdin.once("data", function(data) {
            process.stdin.pause();
            compile(data.toString().trim());
        });
    }
}

start();
