# NodeQuant—一个基于Node.js的简单可依赖量化交易平台

## NodeQuant简介
国内的量化交易平台大多是C、C++、C#、Java、Python等语言编写量化策略。从事量化交易的人员在学会金融数据的分析的同时也要学好一门编程语言，往往学好一门编程语言对于很多人是一个不小的门槛。Javascript语言是一门简单轻便的脚本语言，学习和编写Javascipt程序都非常简单。脚本语言具有弱类型的特点，不需要开发者在编写程序的过程中适配各种数据类型，入门快速。

而且Javascipt有大量的开发者，它是GitHub上最热门的编程语言
![image](http://i2.kiimg.com/1949/f5d21c3656d0792c.jpg)

Javascript语言借助Node.js运行环境,可以使得Javascipt也可以像C++、C#等高级语言一样运行在服务器端，可以进行读写文件，数据库，访问网络等操作。

Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行环境。 
Node.js 使用了一个事件驱动、非阻塞式 I/O 的模型，使其轻量又高效。 
Node.js 的包管理器 npm，是全球最大的开源库生态系统。使用npm可以找到各种各样的第三方库，开发者可以集成到自己的程序当中。

量化交易程序是一种是基于高频网络访问和各种事件（OnTick,OnOrder,OnTrade）的数据密集型程序。由于Node.js非阻塞的，事件驱动的 I/O 操作等特点，使得它处理数据密集型实时应用时非常轻巧高效，可以认为是数据密集型分布式部署环境下的实时应用系统的完美解决方案。

所以使用Node.js来编写和运行量化交易策略程序是一个非常好的解决方案。这就是Nodequant量化交易平台诞生的背景。


## NodeQuant的如何支持量化交易策略
- 一个账号——多策略，支持一个账号多个策略的量化产品模式
- 一个策略——多合约，支持套利
- 一个策略——多市场，支持跨市场套利
- 实现CTP的交易接口，支持中金所，上期所，大商所，郑商所的合约交易


## 搭建NodeQuant运行环境
1. 支持Win7和Win10,暂且不支持Win8
2. 下载安装32位的Node.js v6.11.1 版本（NodeQuant目前支持Node.js v6版本）—— [到Node.js官网下载Windows版本](https://nodejs.org/en/download/)
3. 下载Mongodb数据库—— [到Mongodb官网下载Windows版本](https://www.mongodb.com/download-center/)
4. 安装Mongodb并且启动Mongodb作为Windows服务——[请参考教程](http://www.jb51.net/article/85605.htm)
5. 下载NodeQuant源代码。右上角 -> Clone or download -> Download ZIP ->解压
6. 安装NodeQuant的第三方模块。打开cmd命令窗口，用命令行去到NodeQuant项目根目录，根目录中有package.json文件，输入如下命令会安装package.json中的第三方模块
``` javascript
npm install
```
7. 下载WebStorm集成开发软件——[到WebStorm官网下载Windows版本](http://www.jetbrains.com/webstorm/)
8. Webtorm打开NodeQuant项目,在Settings中设置使用Es6语法。 ![image](http://i2.kiimg.com/1949/c8ce699f9931f362.png)
9. Webtorm添加一个Node.js的运行和调试环境。点击Edit Configurations->点击+号按钮添加Node.js环境![image](http://i1.buimg.com/1949/c9b638912962296f.png)
10. 配置运行和调试环境，nodequant文件夹为工作目录，bin文件夹的www文件为项目的启动文件![image](http://i2.kiimg.com/1949/e5fee1112eec9505.png)
11. 在NodeQuant项目根目录中，userConfig.js文件中ClientConfig项中配置自己的期货账号，密码，行情地址，交易地址![image](http://i2.kiimg.com/1949/8ec64b786a491c98.png)
12. 点击调试运行。看到运行调试信息，运行成功。打印出log：“Demo策略启动成功 ”等log,说明样例策略启动成功。这个空策略的配置在userConfig.js用户配置文件中的StrategyConfig中
![image](http://i1.buimg.com/1949/4536d5524e146b29.png)
