# 主引擎层

NodeQuant系统运行会唯一创建一个主引擎实例，主引擎层代表的就是这个主引擎。主引擎负责启动上层策略引擎和连接底层的各个交易Client，接收来自底层交易Cient的行情信息，并且响应上层策略引擎的下单命令。

这个策略引擎源代码地址：NodeQuant根目录——》engine文件夹——》mainEngine.js

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/%E4%BA%A4%E6%98%93%E5%AE%A2%E6%88%B7%E7%AB%AF%E5%B1%82.PNG?ynotemdtimestamp=1533340258598)

