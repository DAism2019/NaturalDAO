#测试当前网络接点是否能连接上
from web3.auto import w3


connected = w3.isConnected()
print("connected:",connected)
