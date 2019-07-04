需要提前设置私钥、地址和网络环境
 在工程根目录下建立.env文件，写入
 export ADDRESS=your address of ethereum
 export PRIVATE_KEY_MAINNET=your privateKey
 export NET_WORK=localhost
 注意:
NET_WORK可以设置的值有 localhost,homestead,kovan,ropsten等,分别代表本地节点，主网络，kovan测试网，ropsten测试网等
也可以使用 HTTP://domain.com:8545形式
localhost对应的本地节点为 HTTP://127.0.0.1:8545，这里端口号是8545 一般使用Ganache建立
私钥对应的账号在指定网络要有一定数量的ETH

注意：如果上传到GIT，请忽略这个.env文件
