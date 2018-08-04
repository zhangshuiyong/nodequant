# 交易客户端层

交易客户端层集成多个交易客户端。连接交易所，接收来自交易所的信息，响应上层主引擎的在各个交易客户端的下单命令。NodeQuant 未来将会集成上期CTP、飞鼠Sgit 、富途证券、盈透证券IB的程序化API交易客户端，未来可在多市场中交易和套利。**目前已经集成上期CTP和飞鼠Sgit 两个交易客户端。**

交易客户端层源代码地址：NodeQuant根目录——》model文件夹——》client文件夹

上期CTP交易客户端源代码地址：NodeQuant根目录——》model文件夹——》client文件夹——》CTPClient.js

飞鼠Sgit交易客户端源代码地址：NodeQuant根目录——》model文件夹——》client文件夹——》SgitClient.js

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/%E4%BA%A4%E6%98%93%E5%AE%A2%E6%88%B7%E7%AB%AF%E5%B1%82.PNG?ynotemdtimestamp=1533340294666)



