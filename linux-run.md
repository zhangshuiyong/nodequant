# 搭建Linux系统运行环境

## 服务器环境 {#服务器环境}

| 系统 | 阿里云Ubuntu Server 16.04 64位 |
| :--- | :--- |
| CPU | 1核 |
| 内存 | 2G |
| 带宽 | 1Mbps |

## 安装步骤 {#安装步骤}

| 描述 | 命令 |
| :--- | :--- |
| 1.使用putty软件，输入阿里云服务器ip地址，登录阿里云服务器 | [http://rj.baidu.com/soft/detail/15699.html?ald](http://rj.baidu.com/soft/detail/15699.html?ald) |
| 2.更新ububtu server 16.04服务器的安装包 | apt-get update |
| 3.安装git | apt-get install git |
| 4.获取NodeQuant源代码 | git clone [https://github.com/zhangshuiyong/nodequant.git](https://github.com/zhangshuiyong/nodequant.git) |
| 5.获取node.js-8-linux-64位版本 | [https://nodejs.org/en/download/](https://nodejs.org/en/download/) |
| 6. 解压tar.xz文件 | tar xvJf node-v8-linux-x64.tar.xz |
| 7. 进入解压出来的文件夹 | cd node-8-linux-x64 |
| 8. 进入bin文件夹看到node和npm程序 | cd bin |
| 9. 查看当前目录绝对路径 | pwd |
| 10.全局安装node程序 | ln –s 当前目录绝对路径/node /usr/local/bin |
| 11.全局安装npm程序 | ln –s 当前目录绝对路径/npm /usr/local/bin |
| 12.返回用户目录 | cd ~ |
| 13.查看node与npm是否已经全局安装 | node –v、npm –v |
| 14.进入nodequant项目根目录 | cd ./nodequant/nodequant |
| 15.安装nodequant依赖包 | npm install |
| 16.返回用户目录 | cd ~ |
| 17.获得最新稳定版本Redis数据库 | wget [http://download.redis.io/redis-stable.tar.gz](http://download.redis.io/redis-stable.tar.gz) |
| 18.解压Redis数据库 | tar xzf redis-stable.tar.gz |
| 19.进入redis-stable根目录 | cd redis-stable |
| 20.编译redis数据库 | make |
| 21.编译完成，进入src文件夹，redis数据库程序redis-server在src文件夹之下 | cd src |
| 22.查看当前目录绝对路径 | pwd |
| 23.全局安装src文件夹中的数据库服务器redis-server | ln –s 当前目录绝对路径/redis-server /usr/local/bin |
| 24.全局安装src文件夹中的数据库客户端redis-cli | ln –s 当前目录绝对路径/redis-cli /usr/local/bin |
| 25.全局安装src文件夹中的数据库客户端redis-cli | ln –s 当前目录绝对路径/redis-cli /usr/local/bin |
| 26.返回redis-stable根目录，看到redis.conf配置文件 | cd .. |
| 27.使用一个windows电脑程序win-scp，连接阿里云服务器ip地址，找到redis-stable文件夹 | [http://rj.baidu.com/soft/detail/15150.html](http://rj.baidu.com/soft/detail/15150.html) |
| 28.到网盘上下载nodequant-redis.conf配置文件,使用win-scp软件上传nodequant-redis.conf配置文件到redis-stable文件夹 | [http://pan.baidu.com/s/1qYc96JM](http://pan.baidu.com/s/1qYc96JM) |
| 29.使用putty终端进入redis-stable文件夹，启动redis数据库，并且后台运行 | nohup redis-server ./nodequant-redis.conf & |
| 30.运行redis客户端程序，连接得上说明redis数据库已经启动 | redis-cli |
| 31.特别提醒：nodequant-redis.conf配置文件配置了redis数据库的最大使用内存为1gb，如果nodequant系统运行了很久很久，策略状态数据太多临近或者超过1gb，nodequant再向redis数据库存入数据就会报OOM内存已满错误。所以请定期备份redis-stable文件夹下的nodequant.aof数据库文件或者增加服务器内存调整nodequant-redis.conf最大内存设置 |  |
| 33.返回用户目录 | cd ~ |
| 34.进入nodequant项目根目录文件夹，找到CTP的linux版本依赖库: [libthostmduserapi.so和libthosttraderapi.so](http://libthostmduserapi.xn--solibthosttraderapi-6j56a.so/) | cd ./ nodequant/model/client/CTP/linux/x64 |
| 35.查看当前目录绝对路径 | pwd |
| 36.全局安装linux版本的CTP交易客户端的依赖库 [libthostmduserapi.so](http://libthostmduserapi.so/) | ln –s 当前目录绝对路径/libthostmduserapi.so /usr/lib |
| 37.全局安装linux版本的CTP交易客户端的依赖库 [libthosttraderapi.so](http://libthosttraderapi.so/) | ln –s 当前目录绝对路径/libthosttraderapi.so /usr/lib |
| 38.返回nodequant根目录，找到Sgit的linux版本依赖库: [libsgitquotapi.so和libsgittradeapi.so](http://libsgitquotapi.xn--solibsgittradeapi-pf03a.so/) | cd ./ nodequant/model/client/Sgit /linux/x64 |
| 39.查看当前目录绝对路径 | pwd |
| 40.全局安装linux版本的Sgit交易客户端的依赖库 [libsgitquotapi.so](http://libsgitquotapi.so/) | ln –s 当前目录绝对路径/libsgitquotapi.so /usr/lib |
| 41.全局安装linux版本的Sgit交易客户端的依赖库 [libsgittradeapi.so](http://libsgittradeapi.so/) | ln –s 当前目录绝对路径/libsgittradeapi.so /usr/lib |
| 42.回到nodequant项目根目录，启动nodequant系统，并后台运行 | nohup node ./bin/www & |



