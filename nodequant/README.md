# NodeQuant：一个基于Node.js的开源量化金融交易平台



## NodeQuant系统架构
- **Node.js** —— NodeQuant系统是一个基于Node.js的量化交易平台。JavaScript语言也可以开发量化金融交易策略。
- **Express** —— NodeQuant系统使用了Node.js平台的Express网络框架。可以使用Express框架将NodeQuant扩展成为一个互联网量化交易平台
- **NodeQuant** —— NodeQuant系统的核心是NodeQuant量化交易框架。使用NodeQuant量化交易框架，可以运行多个量化交易策略，可以进行多品种、多市场的趋势、套利交易
- **Redis** —— NodeQuant系统使用Redis内存数据库，所有交易数据都保存在内存中，极速响应实盘交易策略


## NodeQuant量化交易框架

1. **策略层**：策略层代表各种量化策略实例。策略实例负责运行交易算法，集成了交易事件响应函数，有OnTick、OnNewBar、OnCloseBar、OnOrder、OnTrade等事件响应函数，驱动量化策略的运行。
2. **策略引擎层**：NodeQuant系统运行会唯一创建一个策略引擎实例，策略引擎层代表的就是这个策略引擎。策略引擎开始运行会根据用户的策略配置创建策略实例，也可以停止策略实例。响应策略的下单命令，推送策略订阅的合约行情，保存策略运行的仓位、订单、成交、结算信息等状态信息，接收交易Client的订单回报，成交回报。
3. **主引擎层**：NodeQuant系统运行会唯一创建一个主引擎实例，主引擎层代表的就是这个主引擎。主引擎负责启动上层策略引擎和连接底层的各个交易Client，接收来自底层交易Cient的行情信息，并且响应上层策略引擎的下单命令。
4. **交易客户端层**：交易客户端层代表着各个交易客户端。连接着各种证券交易所，商品交易所，接收推送来自交易所的行情信息，合约信息。同时，响应上层主引擎的在各个交易客户端的下单命令。目前已经实现了CTP Client,可交易中金所、上期所、大商所，郑商所的合约。

## NodeQuant 最新特性
- 支持上期CTP的API客户端(**Windows Node.js-8-32位、Windows Node.js-8-64位、Linux x64 Node.js-8**)。可交易中金所、上期所、大商所、郑商所的所有期货品种合约
- 支持飞鼠Sgit的API客户端(**Windows Node.js-8-32位、Linux x64 Node.js-8**)。可交易中金所、上期所、大商所、郑商所的所有期货品种合约，并且可交易上海黄金交易所的现货合约。可程序化交易现货黄金、白银。
- 支持一个账号 —— 多策略，支持一个账号多个策略的量化产品模式
- 支持一个策略 —— 多合约，支持趋势、套利交易
- 支持一个策略 —— 多市场，支持跨市场交易、套利
- 支持交易K线周期：秒、分钟、小时
- 支持交易所支持的多种类型订单：限价单，市价单，FAK单，FOK单，条件单。可灵活使用于趋势，套利，钓鱼等交易策略
- 支持盘后自动计算策略盈亏净值
- 极速响应实盘交易。使用Redis内存数据库，记录与查询交易信息
- 支持可视化策略运行状态。使用Redis数据库Windows图形化客户端查看策略运行交易数据，可以查看本地和云服务器的策略运行状态
- 无人值守。支持配置非交易时间自动停止，交易时间自动启动交易策略
- 支持打包加密策略
- 更小的滑点成本。Windows系统中对CTP交易客户端进行测试,系统内Tick-To-FinishSendOrder平均耗时：1.5ms(基于python的vn.py平均耗时22.6ms)

## NodeQuant 2.0即将来到的特性
- 支持连接Tick数据行情服务器，使得策略可预先加载Tick，分钟行情数据。方便策略获取预处理数据
- 支持策略运行异常邮件通知

## 入门教程

[NodeQuant开发文档](https://github.com/zhangshuiyong/nodequant-doc/blob/master/SUMMARY.md)

## Node.js科学计算库

- [mathjs](https://github.com/josdejong/mathjs) - An extensive math library for JavaScript and Node.js.
- [numeric](https://github.com/sloisel/numeric) - Numerical analysis in Javascript.
- [numbers.js](https://github.com/numbers/numbers.js) - Advanced Mathematics Library for Node.js and JavaScript.
- [jmat](https://github.com/lvandeve/jmat) - Complex special functions, numerical linear algebra and statistics in JavaScript.
- [accounting.js](https://github.com/openexchangerates/accounting.js) - A lightweight JavaScript library for number, money and currency formatting - fully localisable, zero dependencies.
- [science.js](https://github.com/jasondavies/science.js) - Scientific and statistical computing in JavaScript.
- [linearReg.js](https://github.com/lastlegion/linearReg.js) - Linear regression with Gradient descent package for NPM.
- [sylvester](https://github.com/jcoglan/sylvester) - Vector, matrix and geometry math JavaScript http://sylvester.jcoglan.com
- [node-svm](https://github.com/nicolaspanel/node-svm) - Support Vector Machines for nodejs
- [numjs](https://github.com/nicolaspanel/numjs) - Like NumPy, in JavaScript

## Node.js多线程库
- [node-webworker-threads](https://github.com/audreyt/node-webworker-threads) - Lightweight Web Worker API implementation with native threads

## Node.js多进程库
- [Cluster](https://nodejs.org/dist/latest-v6.x/docs/api/cluster.html) - A single instance of Node.js runs in a single thread. To take advantage of multi-core systems the user will sometimes want to launch a cluster of Node.js processes to handle the load.

## Node.js的机器学习库
- [machine_learning](https://github.com/junku901/machine_learning) - Machine learning library for Node.js http://joonku.com/project/machine_learning

- [各语言机器学习库整理](https://www.douban.com/group/topic/89453462/)


## Javascript前端图形库

- [echarts 3](http://echarts.baidu.com/)

## 技术交流

欢迎有兴趣使用NodeQuant做量化金融策略的Quanter加入QQ群进行交流和建议

QQ群：197110856

## 贡献
- @James-F-Zhang
