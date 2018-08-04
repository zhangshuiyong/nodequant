# 快速入门

## 如何编写运行一个NodeQuant策略

#### 前言：

文档写到这里，已经默认大家已经搭建好NodeQuant的运行环境了，NodeQuant的源代码也已经用WebStorm打开了，编写NodeQuant策略最好在WebStorm开发环境中编写，因为WebStrom中可以提供代码提示和方便集成require已经安装好的第三方模块。

编写NodeQuant策略是使用Node.js语言。语法为JavaScript（教程：[https://www.runoob.com/js/js-tutorial.html](https://www.runoob.com/js/js-tutorial.html)）的ECMAScript 6语法。什么是JavaScript的ECMAScript 6语法？[http://www.jianshu.com/p/b6d76160889d](http://www.jianshu.com/p/b6d76160889d) ，JavaScript的ECMAScript 5与ECMAScript 6语法主要不同在于变量定义var（ECMAScript 5）与let（ECMAScript 6）关键字的区别，使用function（ECMAScript 5）与class（ECMAScript 6）关键字来定义类的区别。

以下展示如何在WebStorm中编写并且运行一个DemoStrategy策略

#### 定义DemoStrategy策略： {#定义demostrategy策略}

* 策略模板名字：DemoStrategy
* 策略实例名字：Demo
* 交易合约：i1801
* 交易周期：1分钟K线
* 交易客户端：CTP

#### 根据交易合约选择对应的交易客户端： {#根据交易合约选择对应的交易客户端}

* 对应交易客户端：CTP
* 期货经纪商brokerID：9999
* 账号：888888
* 密码：888888
* 期货经纪商的行情服务器地址：tcp://218.202.237.33:10012
* 期货经纪商的行情服务器地址：tcp://218.202.237.33:10002

#### 配置DemoStrategy策略： {#配置demostrategy策略}

1. userConfig.js为用户配置文件。配置文件结构为Json格式的数据。什么是Json格式？[https://baike.baidu.com/item/JSON/2462549?fr=aladdin](https://baike.baidu.com/item/JSON/2462549?fr=aladdin)
2. ClientConfig为交易客户端配置项。
3. StrategyConfig为策略配置项。
4. 可在ClientConfig中配置多个交易客户端。可在StrategyConfig配置多个策略。
5. 如下图，ClientConfig中配置了CTP交易客户端。在StrategyConfig配置了DemoStrategy策略。在StrategyConfig配置项中，**name**是策略的名字，策略的名字是策略的唯一标识。**className**是策略的类名，是已经写好的策略逻辑。相同的className，不同的name\(策略唯一标识\)，系统会创建两个策略实例。**symbols**是策略的交易合约，可配置多个交易合约，策略的OnTick事件函数会接收到多个交易合约的Tick。每个交易合约需要配置对应的交易客户端**clientName**，因为不仅仅CTP交易客户端可以交易商品期货，飞鼠Sgit也可以交易商品期货。**BarType**是K线周期类型，如果策略需要分钟K线行情，可配置**BarType:KBarType.Minute**，支持的K线周期有秒、分钟、小时。**BarInterval**是K线周期的间隔，如1分钟K线，可配置**BarInterval:1**。BarInterval必须是整数。

![userConfig](http://uploadimg.markbj.com/static/resource/image/book/0f6c72da9da611e7866000163e13356e.PNG?ynotemdtimestamp=1533340532755)

#### 编写DemoStrategy策略： {#编写demostrategy策略}

在strategy文件夹下创建DemoStrategy.js文件。这里要特别提醒的是：一、所有策略要是js文件。二、所有策略js文件都需要创建在strategy文件夹下，因为策略的基类baseStrategy.js文件在strategy文件夹下，所有策略都根据与baseStrategy.js文件的相对路径找到策略基类才能继承它。三、所有的策略类都要继承策略基类。

如下图和代码，创建DemoStrategy策略需要7步：

1. 引用BaseStrategy基类: let BaseStrategy=require\("./baseStrategy"\);
2. 让DemoStrategy继承BaseStrategy： class DemoStrategy extends BaseStrategy
3. 传递策略配置对象初始化BaseStrategy： super\(strategyConfig\);
4. 重写OnTick\(tick\)函数给BaseStrategy传递tick，计算K线。
5. 如果策略的交易周期用到K线，需要重写OnClosedBar\(closedBar\)函数与OnNewBar\(newBar\)函数
6. 如果策略需要实现策略停止逻辑，需要重写Stop\(\)函数
7. 把写好的DemoStrategy类作为一个模块提供给策略引擎调用：module.exports=DemoStrategy
8. 运行NodeQuant，会自动加载DemoStrategy，并启动DemoStrategy

> ```text
> let BaseStrategy=require("./baseStrategy");
>
> class DemoStrategy extends BaseStrategy{
>
>     constructor(strategyConfig)
>     {
>     
>         //一定要使用super(strategyConfig)进行基类实例初始化
>     
>         //strategyConfig为 userConfig.js 中的DemoStrategy类的策略配置对象
>     
>         //调用super(strategyConfig)的作用是基类BaseStrategy实例也需要根据strategyConfig来进行初始化
>     
>         super(strategyConfig);
>     
>     }
>     
>     OnClosedBar(closedBar)
>     
>     {
>     
>        console.log(closedBar.symbol+"K线结束,结束时间:"+closedBar.endDateTime.toLocaleString()+",Close价:"+closedBar.close);
>     
>     }
>     
>     OnNewBar(newBar)
>     
>     {
>     
>         console.log(newBar.symbol+"K线开始,开始时间"+newBar.startDateTime.toLocaleString()+",Open价:"+newBar.open);
>     
>     }
>     
>     OnTick(tick)
>     {
>     
>          //调用基类的OnTick函数,否则无法触发OnNewBar、OnClosedBar等事件响应函数
>          //如果策略不需要计算K线,只用到Tick行情,可以把super.OnTick(tick);这句代码去掉,加快速度
>          super.OnTick(tick);
>          console.log(tick.symbol+"的Tick,时间:"+tick.date+" "+tick.time+",价格:"+tick.lastPrice);
>      }
>      Stop(){
>          super.Stop();
>      }
>  }
>  
>  module.exports=DemoStrategy;
> ```

### 进阶：了解策略基类BaseStrategy {#进阶了解策略基类basestrategy}

DemoStrategy虽然顺利运行。但是一个实盘策略不仅仅是接收Tick事件和K线事件，实盘策略需要下单（SendOrder）、成交事件\(OnTrade\)、订单状态事件（OnOrder）、策略的持仓（Position）、净值计算（Settlement）。以上概念都封装到基类BaseStrategy中，所以需要进一步了解BaseStrategy，BaseStrategy基类文件在NodeQuant根目录 --&gt; strategy文件夹 --&gt; baseStrategy.js文件。

| BaseStrategy方法 | 函数作用 |
| :--- | :--- |
| constructor | 根据策略的设置初始化 |
| SendOrder | 策略发出订单，可以发出多种类型的订单。请查看下一节支持订单类型或者查看源代码注释 |
| Stop | 策略退出 |
| OnTick | 计算K线，触发子策略重写的OnClosedBar、OnNewBar事件 |
| OnClosedBar | 设置的K线周期结束一根K线事件，由OnTick计算触发。支持K线周期: 秒、分钟、小时 |
| OnNewBar | 设置的K线周期开始一根K线事件，由OnTick计算触发。支持K线周期: 秒、分钟、小时 |
| OnOrder | 订单状态事件。效仿OnClosedBar函数，子策略也可重写OnOrder事件，在子策略当中处理OnOrder事件。在上一小节中介绍编写DemoStrategy子策略没有介绍OnOrder是因为NodeQuant的策略引擎会自动归类处理策略的OnOrder事件，维护Order的状态。不太需要开发者处理OnOrder事件。详细可以参考NodeQuant架构中的策略引擎层介绍或者自行查看策略引擎的源代码\( NodeQuant根目录 --&gt; engine文件夹 --&gt; strategyEngine.js\) |
| OnTrade | 订单成交事件。效仿OnClosedBar函数，子策略也可重写OnTrade事件，在子策略当中处理OnTrade事件。在上一小节中介绍编写DemoStrategy子策略没有介绍OnTrade是因为NodeQuant的策略引擎会自动归类处理策略的OnTrade事件，维护各个策略的成交列表，更新持仓，保存到数据库等处理。不太需要开发者处理OnOrder事件。详细可以参考NodeQuant架构 --&gt; 策略引擎层介绍或者自行查看策略引擎的源代码\( NodeQuant根目录 --&gt; engine文件夹 --&gt; strategyEngine.js\) |
| GetUnFinishOrderList | 获得策略引擎维护的一个未完成状态（非撤单非全部成交）的订单列表 |
| CancelOrder | 对未完成Order进行撤单 |
| GetPosition | 获得策略引擎对本策略维护的一个仓位管理对象Position。在仓位管理对象中有多重仓位管理函数：获得多仓、多仓均价、空仓、空仓均价、今仓、昨仓、锁仓、非锁多仓、非锁空仓、今锁仓、今非锁多仓、今非锁空仓、昨锁仓、昨非锁多仓、昨非锁空仓。 |
| PriceUp | 获得对当前合约的价格加跳后的价格。劣势下单，为了成交的更高的成功率 |
| PriceDown | 获得对当前合约的价格减跳后的价格。优势下单，为了更好的价格，牺牲成交的成功率 |
| GetLastTick | 通过合约名字获得合约最新Tick |
| QueryTradingAccount | 获取不同交易客户端的交易账户资金情况 |
| OnQueryTradingAccount | 交易客户端资金情况事件。效仿OnClosedBar函数，子策略也可重写OnQueryTradingAccount事件，在子策略当中处理OnQueryTradingAccount事件。返回一个tradingAccountInfo参数，包含着对应的交易客户端名字和交易客户端的所有资金信息 |

### 进阶：SendOrder支持的下单类型 {#进阶sendorder支持的下单类型}

| 交易所 | GFD\(当日有效限价单\) | FAK\(立即全部成交并且立即剩余撤单\) | FOK\(立即全部成交或者立即撤单\) | 市价单 | 条件限价单 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 中金所 | 支持 | 支持 | 支持 | 支持 | 支持 |
| 上期所 | 支持 | 支持 | 支持 | 支持 | 支持 |
| 大商所 | 支持 | 支持 | 支持 | 支持 | 支持 |
| 郑商所 | 支持 | 支持 | 不支持 | 支持 | 支持 |

###  {#进阶查看策略运行状态查看redis数据库}

### 进阶：查看策略运行状态，查看Redis数据库 {#进阶查看策略运行状态查看redis数据库}

在**搭建运行环境**的章节中，已经下载了Redis的图形化客户端，打开Redis Desktop Manager

1.点击“Connect to Redis Server”按钮，弹出创建Redis数据库连接操作框

![image](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/NodeQuant%20Redis.PNG?ynotemdtimestamp=1533341588992)

2.点击“OK”按钮，创建数据库连接，起名为NodeQuant，数据库的host的ip定为本机127.0.0.1，NodeQuant系统也是使用Redis数据库的默认端口6379记录数据的（可查看NodeQauant根目录——》userConfig.js中System\_DBConfig配置项），所以端口填6379就可以了，点击“OK”按钮。

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/Redis%20DB%2010%E4%B8%AA%E6%95%B0%E6%8D%AE%E5%BA%93.PNG?ynotemdtimestamp=1533341588992)

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/Nodequant%E6%95%B0%E6%8D%AE%E5%BA%93.PNG?ynotemdtimestamp=1533341588992)

                    Redis数据库默认自动有16个数据库，db0~db15。NodeQuant系统只用了db0数据库。

3. **NodeQuant\_System\_Log**: 是系统运行的数据库表，记录着系统中各个模块的运行日志信息。表头结构为

* Source:信息的来源
* Type:信息的类型，Info为日志类型信息
* Message:信息的具体信息
* Datetime:信息的时间字符串

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/NodeQuant%20Redis%E6%95%B0%E6%8D%AE%E5%BA%93%E5%86%85%E5%AE%B9.PNG?ynotemdtimestamp=1533341588992)

4.其他数据库表

* \*\*NodeQuant\_System\_Error：\*\*表示系统运行的错误日志
* \*\*策略名字.Order: \*\*表示该策略下的订单记录
* \*\*策略名字.Trade: \*\*表示该策略的成交记录
* \*\*策略名字.Position: \*\*表示该策略所有持仓的具体合约
* \*\*策略名字.Position.合约名字: \*\*表示该策略所有持仓合约的具体仓位记录
* **策略名字.Settlement**: 表示该策略的每天的结算记录

