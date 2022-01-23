import React, { useEffect, useState } from 'react';
import { List, Input, Button, Modal,Tag } from 'antd';
import { EditFilled, DeleteFilled } from '@ant-design/icons';
import './edit.css';

import { STATUS_OF_CONTRACT, Contract, SarTools } from './utils';

const CONTRACTS: Contract[] = [];

function EditContarct(): JSX.Element {
    const [contracts, setContracts ] = useState(CONTRACTS);
    const editContract = (contract:Contract) => {
        contract.status = STATUS_OF_CONTRACT.EDITTING;
        setContracts(contracts.concat([]));
    };
    const submit = (item:Contract)=> {
        setContracts(contracts.concat([]));
        item.status = STATUS_OF_CONTRACT.NORMAL;
        window.socket.emit('resubscribe',contracts.map(c => c.symbol))
    };
    const onNameChange = (item: Contract ,target: HTMLInputElement) => {
        item.symbol = target.value??'';
        setContracts(contracts.concat([]));
    }
    const [addModelVisible, setAddModalVisible] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const newContract = {
        id: "",
        symbol: "",
        price:0,
        status: STATUS_OF_CONTRACT.NORMAL,
    };

    const openAddModal = () => {
        setAddModalVisible(true)
    };
    const closeAddModal = () => {
        setAddModalVisible(false)
    };
    const onInputChange = (target: HTMLInputElement) => {
        setInputValue(target.value)
    };
    const addContract = () => {
        newContract['symbol'] =  inputValue;    
        newContract['id'] = new Date().getTime().toString();
        contracts.push({...newContract});
        setContracts(contracts.concat([]));
        newContract['symbol'] = '';    
        newContract['id'] = '';
        setInputValue('');
        closeAddModal();
        window.socket.emit('subscribe',inputValue)
    };
    const deleteContract = (contract: Contract) => {
        const index = contracts.findIndex( c => c.symbol === contract.symbol);
        if (index >= 0) {
            contracts.splice(index,1);

            setContracts(contracts.concat([]));
            window.socket.emit('unsubscribe',inputValue)

        }
    };
    const deleteConfirm = (item: Contract) => {
        Modal.confirm({
            title: "确认",
            content: "确认删除此合约吗？",
            okText: "确定",
            cancelText: "取消",
            onOk: () => deleteContract(item)
        });
    };

    useEffect(()=>{
        const interval = window.setInterval(()=>{
            const localContracts = localStorage.contracts?JSON.parse(localStorage.contracts).contracts as Contract[]:[];

            if(contracts.length>0){
                localContracts.forEach((_contract: Contract)=> {
                    const c = contracts.find( contract => contract.symbol === _contract.symbol );
                    if(c){
                        c.ticket = _contract.ticket;
                        if(c.ticket){
                            !c.sarTools && (c.sarTools = SarTools());
                            c.sar = c.sarTools.SAR(c.ticket);
                        }
                    }
                });
                setContracts(contracts.concat([]));

            }else{
                setContracts(localContracts);

            }
           
        },5000);
        return () => {
            clearInterval(interval)
        }
    })
    
    
    return <div>
        <List 
            className="contracts"
            itemLayout="horizontal"
            dataSource={contracts}
            renderItem={
                item => (
                    <List.Item key={item.symbol} title={item.symbol} className={item.status??"normal"}>
                        <div className="name">
                            <b>{item.symbol}</b>
                            <Input value={item.symbol} className="input" onChange={(e: React.ChangeEvent) => onNameChange(item, e.target as HTMLInputElement)} addonAfter={<Button onClick={() => submit(item)} type="text" size="small">确定</Button>} />
                            <span className="extra">
                                <EditFilled onClick={() => editContract(item)}/>
                                <DeleteFilled style={{color:'#ff4d4f'}} onClick={() => deleteConfirm(item)} />
                            </span>
                        </div>
                        <div>
                            <span className="price">收盘价：<Tag color="#2db7f5">{ item.ticket?.closePrice || 0 }</Tag></span>
                            <span className="price">开盘价：<Tag color="#2db7f5">{ item.ticket?.openPrice || 0 }</Tag></span>
                        </div>
                        <div>
                            <span className="price">最高价：<Tag color="#f50">{ item.ticket?.highPrice || 0 }</Tag></span>
                            <span className="price">最低价：<Tag color="#87d068">{ item.ticket?.lowPrice || 0 }</Tag></span>
                        </div>
                        <div>
                            <span className="price">SAR：<Tag color="#108009">{ item.sar || '' }</Tag></span>
                            
                            <span className="price">SAR向上穿越：<Tag color="default">{ item.sarTools?.isUpCross && item.sarTools?.isUpCross()?"发生":"未发生" }</Tag></span>
                            <span className="price">SAR向下穿越：<Tag color="default">{ item.sarTools?.isDownCross && item.sarTools?.isDownCross()?"发生":"未发生" }</Tag></span>
                        </div>
                      
                      
                        
                    
                    </List.Item>
                )
            }
        ></List>
        <p>
            <Button type="primary" onClick={openAddModal}>增加</Button>
        </p>

        <Modal cancelText="取消" okText="增加" title="增加合约" visible={addModelVisible} onCancel={closeAddModal} onOk={addContract}>
          <p>
            <Input value={inputValue} addonBefore="合约代码" onChange={(e: React.ChangeEvent) => onInputChange(e.target as HTMLInputElement)} />
          </p>
        </Modal>
    </div>
}

export default EditContarct