# 策略引擎层

NodeQuant系统运行会唯一创建一个策略引擎实例，策略引擎层代表的就是这个策略引擎。策略引擎开始运行会根据用户的策略配置创建策略实例，也可以停止策略实例。响应策略的下单命令，推送策略订阅的合约行情，保存策略运行的仓位、订单、成交、结算信息等状态信息，接收交易Client的订单回报，成交回报。

这个策略引擎源代码地址：NodeQuant根目录——》engine文件夹——》strategyEngine.js

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/%E7%AD%96%E7%95%A5%E5%BC%95%E6%93%8E%E5%B1%82.PNG?ynotemdtimestamp=1533340209720)

