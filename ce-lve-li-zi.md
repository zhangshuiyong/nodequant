# 策略例子



策略例子的代码位于策略层源代码中

策略层源代码地址：NodeQuant根目录——》strategy文件夹

**BaseStrategy**

所有策略的基类，所有策略必须继承**BaseStrategy**，才能运作事件处理函数，才能下单。

基类BaseStrategy源代码地址：NodeQuant根目录——》strategy文件夹——》baseStrategy.js

**DemoStrategy策略：**

DemoStrategy源代码地址：NodeQuant根目录——》strategy文件夹——》DemoStrategy.js

DemoStrategy策略思想：

通过打印语句（console.log）提示OnTick、OnNewBar、OnClosedBar等事件处理函数正在工作。

**Open\_CloseStrategy策略：**

Open\_CloseStrategy源代码地址：NodeQuant根目录——》strategy文件夹——》Open\_CloseStrategy.js

Open\_CloseStrategy策略思想：

设定一个开仓时间，一个平仓时间。到达开仓时间，执行开仓下单命令。到达平仓时间，执行平仓下单命令

Open\_CloseStrategy策略展示内容：

1. 如何配置策略参数：\*\*userConfig.js \*\*的 **StrategyConfig** 中设置开仓、平仓时间
2. 查询持仓：GetPosition
3. 下单：SendOrder

