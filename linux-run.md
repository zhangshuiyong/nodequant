# 搭建Docker/Linux运行环境

## 运行步骤

| 描述 | 命令 |
| :--- | :--- |
| 1. PC安装docker| |
| 2. 拉取nodequant的docker镜像| docker pull noquant/nodequant:linux_x64_node10_ctp6.3.15 |
| 3. 启动一个nodequant的容器 | docker run -d --name nodequant --workdir /root -it noquant/nodequant:linux_x64_node10_ctp6.3.15 |
| 4. 登入容器 | docker exec -it nodequant bash |
| 5. 启动redis-server | nohup redis-server ./nodequant-redis.conf & |
| 6. 检查redis-server数据库已经启动,有输出代表已启动 | lsof -i:6379 |
| 7. 特别提醒：nodequant-redis.conf配置文件配置了redis数据库的最大使用内存为1gb，如果nodequant系统运行了很久很久，策略状态数据太多临近或者超过1gb，nodequant再向redis数据库存入数据就会报OOM内存已满错误。所以请定期备份redis-stable文件夹下的nodequant.aof数据库文件或者增加服务器内存调整nodequant-redis.conf最大内存设置 |  |
| 8. 配置simnow的账号密码与服务器地址 | vim nodequant/userConfig.js |
| 9. 进入nodequant根目录，启动nodequant系统与策略，并后台运行 | node ./bin/www |



