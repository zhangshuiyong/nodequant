import React, { useEffect, useState } from 'react';
import { Card, Col, Row, List, Tag } from 'antd';
import { Contract } from './utils';

function ViewContarct() {
    const [topFive, setTopFive] = useState({
        increase: [],
        decrease: [],
        volume: [],
    })
    useEffect(() => {
        const interval = window.setInterval(() => {
            const topFive = localStorage.topFive?JSON.parse(localStorage.topFive):{};
            if (topFive) {
                setTopFive(topFive);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);
    return <div>
        <Row gutter={16}>
            <Col span={8}>
                <Card title="涨幅前五" bordered={false}>
                    <List dataSource={topFive.increase} renderItem={(item: Contract) => (<List.Item>{item.symbol}<Tag color="#f50">{Math.floor((item.ticket?.increase ?? 0)*100)+ "%"}</Tag></List.Item>)}></List>
                </Card>
            </Col>
            <Col span={8}>
                <Card title="跌幅前五" bordered={false}>
                    <List dataSource={topFive.decrease} renderItem={(item: Contract) => (<List.Item>{item.symbol}<Tag color="#87d068">{Math.floor((item.ticket?.decrease ?? 0)*100)+ "%"}</Tag></List.Item>)}></List>
                </Card>
            </Col>
            <Col span={8}>
                <Card title="交易量前五" bordered={false}>
                    <List dataSource={topFive.volume} renderItem={(item: Contract) => (<List.Item>{item.symbol}<Tag color="blue">{item.ticket?.volume}</Tag></List.Item>)}></List>
                </Card>
            </Col>
        </Row>
    </div>
}

export default ViewContarct
