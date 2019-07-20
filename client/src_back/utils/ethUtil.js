import {ethers} from 'ethers';
import UncheckedJsonRpcSigner from './signer';
import ERC20_ABI from '../constants/abis/Ico.json';
import FACTORY_ABI from '../constants/abis/Factory.json'
import EXCHANGE_ABI from '../constants/abis/Exchange.json'
import {FACTORY_ADDRESSES} from '../constants'

const ERROR_CODES = ['TOKEN_NAME', 'TOKEN_SYMBOL', 'TOKEN_DECIMALS'];
const ETHERSCAN_PREFIXES = {
    1: '',
    3: 'ropsten.',
    4: 'rinkeby.',
    5: 'goerli.',
    42: 'kovan.'
};

let Util = {
    factoryContract: {},
    ERROR_CODES: ERROR_CODES.reduce((accumulator, currentValue, currentIndex) => {
        accumulator[currentValue] = currentIndex;
        return accumulator;
    }, {}),
    safeAccess: (object, path) => {
        if (object) {
            return path.reduce((accumulator, currentValue) => (
                accumulator && accumulator[currentValue]
                ? accumulator[currentValue]
                : null), object);
        } else {
            return null;
        }
    },
    getEtherscanLink: (networkId, data, type) => {
        const prefix = `https://${ETHERSCAN_PREFIXES[networkId] || ETHERSCAN_PREFIXES[1]}etherscan.io`;
        switch (type) {
            case 'transaction':
                return `${prefix}/tx/${data}`;
            case 'address':
            default:
                return `${prefix}/address/${data}`;
        }
    },
    getNetworkName: (networkId) => {
        let result = "";
        switch (networkId) {
            case 1:
                result = 'the Main Ethereum Network';
                break;
            case 3:
                result = 'the Ropsten Test Network';
                break;
            case 4:
                result = 'the Rinkeby Test Network';
                break;
            case 5:
                result = 'the Görli Test Network';
                break;
            case 42:
                result = 'the Kovan Test Network';
                break;
            default:
                result = 'the correct network';
                break;
        }
        return result;
    },
    isAddress: (value) => {
        try {
            return ethers.utils.getAddress(value.toLowerCase());
        } catch (error) {
            return false;
        }
    },
    shortenAddress: (address, digits = 4) => {
        if (!Util.isAddress(address)) {
            throw Error(`Invalid 'address' parameter '${address}'.`);
        }
        return `${address.substring(0, digits + 2)}...${address.substring(42 - digits)}`;
    },
    shortenTransactionHash: (hash, digits = 4) => {
        return `${hash.substring(0, digits + 2)}...${hash.substring(66 - digits)}`;
    },
    calculateGasMargin: (value, margin) => {
        const offset = value.mul(margin).div(ethers.utils.bigNumberify(10000));
        return value.add(offset);
    },
    getProviderOrSigner: () => {
        //todo
    },
    getContract: (address, ABI) => {
        if (!isAddress(address) || address === ethers.constants.AddressZero) {
            throw Error(`Invalid 'address' parameter '${address}'.`);
        }
        return new ethers.Contract(address, ABI, Util.getProviderOrSigner());
    },
    getFactoryContract: (networkId) => {
        if (!Util.factoryContract[networkId]) {
            Util.factoryContract[networkId] = Util.getContract(FACTORY_ADDRESSES[networkId], FACTORY_ABI);
        }
        return Util.factoryContract[networkId];
    },
    getExchangeContract: (exchangeAddress) => {
        return Util.getContract(exchangeAddress, EXCHANGE_ABI);
    },
    getTokenExchangeAddressFromFactory: async (tokenAddress, networkId) => {
        let factory = Util.getFactoryContract(networkId);
        let exchange = await factory.getExchange(tokenAddress);
        return exchange;
    },
    getTokenInfo: async (tokenAddress) => {
        if (!isAddress(tokenAddress)) {
            throw Error(`Invalid 'tokenAddress' parameter '${tokenAddress}'.`);
        }
        try {
            let contract = Util.getContract(tokenAddress, ERC20_ABI);
            let name = await contract.name();
            let symbol = await contract.symbol();
            let decimals = await contract.decimals();
            decimals = + (decimals.toString());
            return {name, symbol, decimals};
        } catch (error) {
            return null;
        }
    },
    //需要测试这个结果是不是bigNumber
    getEtherBalance: async (address, library) => {
        if (!isAddress(address)) {
            throw Error(`Invalid 'address' parameter '${address}'`);
        }
        let balance = await library.getBalance(address);
        balance = + (balance.toString());
        return balance;
    },
    getTokenBalance: async (tokenAddress, address, library) => {
        if (!isAddress(tokenAddress) || !isAddress(address)) {
            throw Error(`Invalid 'tokenAddress' or 'address' parameter '${tokenAddress}' or '${address}'.`);
        }
        let tokenContract = Util.getContract(tokenAddress, ERC20_ABI);
        let balance = await tokenContract.balanceOf(address);
        balance = + (balance.toString());
        return balance;
    },
    getTokenAllowance: async (address, tokenAddress, spenderAddress, library) => {
        if (!isAddress(address) || !isAddress(tokenAddress) || !isAddress(spenderAddress)) {
            throw Error("Invalid 'address' or 'tokenAddress' or 'spenderAddress' parameter" + `'${address}' or '${tokenAddress}' or '${spenderAddress}'.`)
        }
        let tokenContract = Util.getContract(tokenAddress, ERC20_ABI);
        let allowance = await allowance.balanceOf(address, spenderAddress);
        allowance = + (allowance.toString());
        return allowance;
    }
}

export default Util;
