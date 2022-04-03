import React, { useState } from 'react';
import { Layout, Menu, Button} from 'antd';
import ViewContarct from './ViewContract';
import EditContarct from './EditContarct';
import 'antd/dist/antd.css';
import './App.css';
import {io} from 'socket.io-client';
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
const { Sider, Content } = Layout;
const { SubMenu } = Menu;
const server = import.meta.env['VITE_SERVER'] || 'http://101.132.116.130';
const port = '8081';
const address = server + ':' + port;
declare global {
  interface Window {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>;
  }
}


const socket = io( address);
(window as any).socket = socket;

socket.on('subscribeContracts', (data: unknown) => {
  localStorage.contracts = JSON.stringify(data);
});

socket.on('market', (data: unknown) => {
  localStorage.setItem('topFive', JSON.stringify(data));
});
socket.on('error', ()=>{
  socket.close()
  socket.connect()
});

function notifyMe() {
  // 检查浏览器是否支持 Notification
  if (!("Notification" in window)) {
      alert("你的不支持 Notification!  TAT");
  }

  // 检查用户是否已经允许使用通知
  else if (Notification.permission === "granted") {
      // 创建 Notification
      var notification = new Notification("Au111 ",{
        silent:false,
      });
      (document.querySelector('#audio') as HTMLAudioElement)?.play()
  } else if (Notification.permission !== 'denied') {
      Notification.requestPermission(function (permission) {

          // 用户同意使用通知
          if (!('permission' in Notification)) {
              (Notification as any).permission = permission;
          }

          if (permission === "granted") {
              // 创建 Notification
              var notification = new Notification("Au111 ");

          }
      });
  }
}
socket.on('test', () => {
  notifyMe()
})
function App() {
  const [ content, setContent ] = useState('view');
  const select = (content: string) => setContent(content);
  const test = () => {
    socket.emit('testNotify')
  };
  return (
    <Layout className="app">
         <Sider>
        <Menu theme="dark" mode="vertical" defaultSelectedKeys={['view']} onClick={e => select(e.key)}>
          <Menu.Item key="view">市场信息</Menu.Item>
          <Menu.Item key="edit">订阅合约</Menu.Item>
        </Menu>
        </Sider> 
        <Content className="content">
          {
            content === 'view'?<ViewContarct/>:<EditContarct/>
          }
          {/* <Button onClick={test}>测试</Button> */}

        </Content>
    </Layout>
  )
}

export default App
