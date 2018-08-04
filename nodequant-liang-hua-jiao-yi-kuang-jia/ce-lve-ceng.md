# 策略层

策略层代表各种量化策略实例。策略实例负责运行交易算法，集成了交易事件响应函数，有OnTick、OnNewBar、OnCloseBar、OnOrder、OnTrade等事件响应函数，驱动量化策略的运行。具体细节可以查看**快速入门**章节。

策略层源代码地址：NodeQuant根目录——》strategy文件夹

策略层策略基类BaseStrategy源代码地址：NodeQuant根目录——》strategy文件夹——》baseStrategy.js

策略层样例策略类DemoStrategy源代码地址：NodeQuant根目录——》strategy文件夹——》DemoStrategy.js

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/%E7%AD%96%E7%95%A5%E5%B1%82.PNG?ynotemdtimestamp=1533340146705)



