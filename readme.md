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


注意，本地环境无法使用metamask，现在已经在ropsten测试网上进行测试

目录分类说明：
1、abi 存放所有合约的ABI
2、address 一键部署时使用，现在一键部署在kovan和ropsten上未知原因不能运行了（可以在本地运行）,请略过
3、bytecode 存放所有合约字节码
4、client 客户端（交易所界面）
5、contracts 存放所有合约源码
6、scripts 编译和部署脚本
7、server 服务器端（每小时更新一次ETH价格使用）
8、service，将一些服务独立出来，以使服务器端和脚本均可以使用
9、testByPython 使用python脚本快速测试合约，基于本地测试环境，适当修改后可以应用于主网或者其它测试网
