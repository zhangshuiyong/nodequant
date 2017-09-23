# NodeQuant：一个基于Node.js的开源量化金融交易平台
![image](http://i2.kiimg.com/1949/2fbd754431d72fa9.jpg)

## NodeQuant的愿景

让Node.js社区轻巧地开发和部署量化金融交易程序，成为一个简单、高效、可依赖的量化交易平台

## NodeQuant如何支持量化交易

- 一个账号 —— 多策略，支持一个账号多个策略的量化产品模式
- 一个策略 —— 多合约，支持套利
- 一个策略 —— 多市场，支持跨市场交易、套利
- 多个市场 —— NodeQuant 未来将会全部集成CTP、飞鼠Sgit 、富途证券、盈透证券IB的程序化API交易客户端，未来可在多市场中交易和套利
- 上期CTP  —— 中金所、上期所、大商所、郑商所的商品期货、期权合约
- 飞鼠Sgit —— 期货、上海黄金交易所的贵金属现货
- 富途证券 —— 港股、美股、A股
- 盈透证券 —— 全球24个国家100多个市场中心的股票、期权、期货、外汇等产品
- 使用JavaScript语言开发量化交易策略。与C++相比不需要策略研究员处理琐碎但重要的内存管理问题。Node.js的速度也非常快，与C++处于同一个级别速度，且入门简单，能够快速开发程序。

## NodeQuant简介
国内的量化交易平台大多是C、C++、C#、Java、Python等语言编写量化策略。从事量化交易的人员在学会金融数据的分析的同时也要学好一门编程语言，往往学好一门编程语言对于很多人是一个不小的门槛。JavaScript语言是一门简单轻便的脚本语言，学习和编写JavaScript程序都非常简单。脚本语言具有弱类型的特点，不需要开发者在编写程序的过程中适配各种数据类型，入门快速。

而且JavaScript有大量的开发者，它是GitHub上最热门的编程语言
![image](http://i2.kiimg.com/1949/f5d21c3656d0792c.jpg)

JavaScript语言借助Node.js运行环境,可以使得JavaScript也可以像C++、C#等高级语言一样运行在服务器端，可以进行读写文件，数据库，访问网络等操作。

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行环境。 
Node.js 使用了一个事件驱动、非阻塞式 I/O 的模型，使其轻量又高效。 
Node.js 的包管理器 npm，是全球最大的开源库生态系统。使用npm可以找到各种各样的第三方库，开发者可以集成到自己的程序当中。

量化金融交易程序是一种是基于高频网络访问和各种事件（OnTick,OnOrder,OnTrade）的数据密集型程序。由于Node.js非阻塞的，事件驱动的 I/O 操作等特点，使得它处理数据密集型实时应用时非常轻巧高效，可以认为是数据密集型分布式部署环境下的实时应用系统的完美解决方案。

所以使用Node.js来编写和运行量化交易策略程序是一个非常好的解决方案，这就是NodeQuant量化交易平台诞生的背景。

## NodeQuant系统架构
![node.js](http://i2.nbimg.com/605009/5509796883d486c7.jpg)![加](http://i4.fuimg.com/605009/be9d40cbc1b82106.jpg)![express](http://i2.nbimg.com/605009/eefea14a8a637385.jpg)![加](http://i4.fuimg.com/605009/be9d40cbc1b82106.jpg)![nodequant](http://i2.nbimg.com/605009/038aef6f11b224f4.jpg)![加](http://i4.fuimg.com/605009/be9d40cbc1b82106.jpg)![redis](http://i2.nbimg.com/605009/c0038278cda84ed5.jpg)
- **Node.js** —— NodeQuant系统是一个基于Node.js的量化交易平台。JavaScript语言也可以开发量化金融交易策略。
- **Express** —— NodeQuant系统使用了Node.js平台的Express网络框架。可以使用Express框架将NodeQuant扩展成为一个互联网量化交易平台
- **NodeQuant** —— NodeQuant系统的核心是NodeQuant量化交易框架。使用NodeQuant量化交易框架，可以运行多个量化交易策略，可以进行多品种、多市场的趋势、套利交易
- **Redis** —— NodeQuant系统使用Redis内存数据库，所有交易数据都保存在内存中，极速响应实盘交易策略


## NodeQuant量化交易框架

![image](http://i2.kiimg.com/1949/5c05aec0fc211d76.png)

1. **策略层**：策略层代表各种量化策略实例。策略实例负责运行交易算法，集成了交易事件响应函数，有OnTick、OnNewBar、OnCloseBar、OnOrder、OnTrade等事件响应函数，驱动量化策略的运行。
2. **策略引擎层**：NodeQuant系统运行会唯一创建一个策略引擎实例，策略引擎层代表的就是这个策略引擎。策略引擎开始运行会根据用户的策略配置创建策略实例，也可以停止策略实例。响应策略的下单命令，推送策略订阅的合约行情，保存策略运行的仓位、订单、成交、结算信息等状态信息，接收交易Client的订单回报，成交回报。
3. **主引擎层**：NodeQuant系统运行会唯一创建一个主引擎实例，主引擎层代表的就是这个主引擎。主引擎负责启动上层策略引擎和连接底层的各个交易Client，接收来自底层交易Cient的行情信息，并且响应上层策略引擎的下单命令。
4. **交易客户端层**：交易客户端层代表着各个交易客户端。连接着各种证券交易所，商品交易所，接收推送来自交易所的行情信息，合约信息。同时，响应上层主引擎的在各个交易客户端的下单命令。目前已经实现了CTP Client,可交易中金所、上期所、大商所，郑商所的合约。

## NodeQuant 1.6.0 的特性
- 支持上期CTP的API客户端(**Windows Node.js-v6-32位、Windows Node.js-v6-64位、Linux Node.js-v6-64位**)。可交易中金所、上期所、大商所、郑商所的所有期货品种合约
- 支持飞鼠Sgit的API客户端(**Windows Node.js-v6-32位、Linux Node.js-v6-64位**)。可交易中金所、上期所、大商所、郑商所的所有期货品种合约，并且可交易上海黄金交易所的现货合约。可程序化交易现货黄金、白银。
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
- 更小的滑点成本。NodeQuant系统内Tick-To-FinishSendOrder平均耗时：1.5~0.7ms(基于python的vn.py平均耗时22.6ms)。

## NodeQuant 2.0即将来到的特性
- 支持连接Tick数据行情服务器，使得策略可预先加载Tick，分钟行情数据。方便策略获取预处理数据
- 支持策略运行异常邮件通知

## 入门教程

[NodeQuant开发文档](https://www.markbj.com/book/2ui9718/15921)

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
- [tagg2](https://github.com/DoubleSpout/node-threads-a-gogo2) - Cross platform Simple and fast JavaScript threads for Node.js

## Javascript前端图形库

- [echarts 3](http://echarts.baidu.com/)

## 技术交流

欢迎各位对NodeQuant有兴趣的Quanter加入QQ群进行技术交流和建议

QQ群：197110856
