from os.path import dirname, abspath
from json import loads


def getInfo():
    path = dirname(dirname(abspath(__file__))) + '/.key'
    content = loads(open(path).read())
    return (content['address'],content['privateKey'])


(my_address,private_key) = getInfo()
