# 搭建Windows运行环境

1. 支持Win7和Win10
2. 下载安装Windows版本的Node.js 8。NodeQuant CTP客户端目前已经支持Windows 32位和64位的Node.js 8，只使用CTP客户端做交易,下载32位或者64位的Windows版Node.js 8都可以。NodeQuant Sgit客户端目前支持32位的Windows版Node.js 8, 需要使用飞鼠Sgit客户端做交易，请下载32位的Windows版本—— [到Node.js官网下载Windows版本Node.js 8](https://nodejs.org/en/download/)
3. 下载安装Windows版本Redis,并启动为Windows服务—— [请参考教程](http://keenwon.com/1275.html)
4. 下载安装Redis的桌面客户端，可以方便查看NodeQuant保存在Redis数据库中的数据。[可以到官网下载Windows版本客户端](https://redisdesktop.com/download)
5. 下载安装32位和64位的 [Visual C++ Redistributable for Visual Studio 2015](https://www.microsoft.com/zh-cn/download/details.aspx?id=48145) ,若果还是不能运行提示错误：**return process.dlopen\(module, path.\_makeLong\(filename\)\);**  请下载"dll修复工具"进行修复windows系统缺失的dll，链接: [https://pan.baidu.com/s/1zdGy4w4F-EhYCOg6ykQPwQ](https://pan.baidu.com/s/1zdGy4w4F-EhYCOg6ykQPwQ) 密码: siiw
6. 下载NodeQuant源代码 —— [NodeQuant的GitHub项目地址](https://github.com/zhangshuiyong/nodequant)
7. 安装NodeQuant的第三方模块。打开cmd命令窗口，用命令行去到NodeQuant项目根目录，根目录中有package.json文件，cmd命令窗口中输入命令`npm install` ，安装package.json中的第三方模块
8. 下载WebStorm集成开发软件 —— 到WebStorm官网下载Windows版本 [http://www.jetbrains.com/webstorm/](http://www.jetbrains.com/webstorm/)
9. WebStorm打开NodeQuant项目,在Settings中设置使用ECMAScript 6语法

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/设置成支持Javascript的Es6语法.png)

10. 在WebStorm中打开Node.js的代码提示功能，可以在编写代码的时候自动提示对象的函数，属性等名字，更方便编写Node.js程序。在WebStorm的Settings -&gt; Languages & Frameworks -&gt; Node.js and NPM -&gt; Node.js Core library is not enabled -&gt; 点击Enable，就启用了Node.js的代码提示功能了。

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/enable.png)

11. WebStorm添加一个Node.js的运行和调试环境。点击Edit Configurations-&gt;点击 **+** 号按钮添加Node.js环境

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/Edit%20Nodejs.png)

12. 配置运行和调试环境，nodequant文件夹为工作目录，bin文件夹的www文件为项目的启动文件

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/配置NodeQuant的Node.js的项目运行环境.png)

13. 在NodeQuant项目根目录中，userConfig.js文件中ClientConfig项中配置自己的期货账号，密码，行情地址，交易地址

![userConfig](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/配置CTP账号密码.png)

14. 点击调试运行。看到运行调试信息，运行成功。打印出log：“Demo策略启动成功 ”等log,说明样例策略启动成功。这个空策略的配置在userConfig.js用户配置文件中的StrategyConfig中

![](https://raw.githubusercontent.com/zhangshuiyong/Img/master/nodequant/NodeQuant运行成功.png)

