import { Socket } from "socket.io";
import { Contract, Ticket } from "./utils";
import { Top } from './Top';

const http = require('http');

const portSocket = 8081;

var serverSocket = http.createServer();

const contracts = [
    "TA204",
    "FG204",
    "MA204",
    "SF204",
    "SM204",];
serverSocket.listen(portSocket);

const io = require('socket.io')(serverSocket, { cors: true });

const subscribeContracts = new Set();

const topFive = {
    increase: [] as Ticket[],
    decrease: [] as Ticket[],
    volume: [] as Ticket[],
};
const top = new Top();

top.init();

const testData: Ticket[] = [
    { openPrice: 5238, highPrice: 5239, lowPrice: 5237, closePrice: 5239, preClosePrice: 5288 },

    { openPrice: 5240, highPrice: 5241, lowPrice: 5238, closePrice: 5241 },

    { openPrice: 5241, highPrice: 5241, lowPrice: 5229, closePrice: 5231 },

    { openPrice: 5231, highPrice: 5232, lowPrice: 5210, closePrice: 5210 },

    { openPrice: 5211, highPrice: 5218, lowPrice: 5210, closePrice: 5212 },

    { openPrice: 5212, highPrice: 5216, lowPrice: 5203, closePrice: 5207 },

    { openPrice: 5208, highPrice: 5216, lowPrice: 5207, closePrice: 5216 },

    { openPrice: 5216, highPrice: 5216, lowPrice: 5207, closePrice: 5210 },

    { openPrice: 5209, highPrice: 5210, lowPrice: 5204, closePrice: 5205 },

    { openPrice: 5204, highPrice: 5211, lowPrice: 5204, closePrice: 5206 },

    { openPrice: 5206, highPrice: 5206, lowPrice: 5184, closePrice: 5184 },

    { openPrice: 5185, highPrice: 5196, lowPrice: 5184, closePrice: 5193 },

    { openPrice: 5193, highPrice: 5204, lowPrice: 5192, closePrice: 5202 },

    { openPrice: 5201, highPrice: 5208, lowPrice: 5199, closePrice: 5207 },

    { openPrice: 5206, highPrice: 5210, lowPrice: 5204, closePrice: 5208 },

    { openPrice: 5209, highPrice: 5215, lowPrice: 5207, closePrice: 5210 },

    { openPrice: 5210, highPrice: 5211, lowPrice: 5206, closePrice: 5210 },

    { openPrice: 5210, highPrice: 5210, lowPrice: 5193, closePrice: 5195 },

    { openPrice: 5195, highPrice: 5198, lowPrice: 5192, closePrice: 5197 },

    { openPrice: 5197, highPrice: 5199, lowPrice: 5194, closePrice: 5195 },

    { openPrice: 5195, highPrice: 5209, lowPrice: 5194, closePrice: 5207 },

    { openPrice: 5208, highPrice: 5210, lowPrice: 5205, closePrice: 5205 },

    { openPrice: 5205, highPrice: 5210, lowPrice: 5205, closePrice: 5205 },

    { openPrice: 5205, highPrice: 5210, lowPrice: 5204, closePrice: 5209 },

    { openPrice: 5209, highPrice: 5209, lowPrice: 5202, closePrice: 5206 },

    { openPrice: 5205, highPrice: 5209, lowPrice: 5203, closePrice: 5203 },

    { openPrice: 5204, highPrice: 5207, lowPrice: 5202, closePrice: 5205 },

    { openPrice: 5205, highPrice: 5210, lowPrice: 5204, closePrice: 5204 },

    { openPrice: 5205, highPrice: 5205, lowPrice: 5194, closePrice: 5198 },

    { openPrice: 5199, highPrice: 5202, lowPrice: 5197, closePrice: 5197 },

    { openPrice: 5197, highPrice: 5201, lowPrice: 5196, closePrice: 5198 },

    { openPrice: 5198, highPrice: 5198, lowPrice: 5194, closePrice: 5197 },

    { openPrice: 5198, highPrice: 5204, lowPrice: 5197, closePrice: 5202 },

    { openPrice: 5202, highPrice: 5208, lowPrice: 5202, closePrice: 5206 },

    { openPrice: 5206, highPrice: 5207, lowPrice: 5201, closePrice: 5202 },

    { openPrice: 5202, highPrice: 5216, lowPrice: 5202, closePrice: 5216 },

    { openPrice: 5215, highPrice: 5218, lowPrice: 5211, closePrice: 5215 },

    { openPrice: 5214, highPrice: 5217, lowPrice: 5211, closePrice: 5216 },

    { openPrice: 5217, highPrice: 5217, lowPrice: 5206, closePrice: 5202 },

    { openPrice: 5214, highPrice: 5216, lowPrice: 5210, closePrice: 5210 },

    { openPrice: 5211, highPrice: 5213, lowPrice: 5210, closePrice: 5212 },

    { openPrice: 5213, highPrice: 5215, lowPrice: 5207, closePrice: 5208 },

    { openPrice: 5209, highPrice: 5212, lowPrice: 5208, closePrice: 5210 },

    { openPrice: 5209, highPrice: 5209, lowPrice: 5207, closePrice: 5207 },

    { openPrice: 5208, highPrice: 5212, lowPrice: 5206, closePrice: 5211 },

    { openPrice: 5211, highPrice: 5214, lowPrice: 5210, closePrice: 5210 },

    { openPrice: 5211, highPrice: 5211, lowPrice: 5208, closePrice: 5210 },

    { openPrice: 5209, highPrice: 5216, lowPrice: 5208, closePrice: 5213 },

    { openPrice: 5214, highPrice: 5217, lowPrice: 5212, closePrice: 5217 },

    { openPrice: 5217, highPrice: 5230, lowPrice: 5217, closePrice: 5229 }];

io.on('connection', (socket: Socket) => {

    setInterval(function () {

        const contractArray: Contract[] = [];
        contracts.forEach(key => {
            const ticket = testData[Math.floor(Math.random() * testData.length)];
            contractArray.push({
                symbol: key,
                ticket: ticket
            })
            top.update(ticket)
        });


        const data: Contract[] = [];

        Array.from(subscribeContracts).forEach(c => {
            const contract = {
                symbol: c,
                ticket: testData[Math.floor(Math.random() * testData.length)]
            } as Contract;
            data.push(contract);
        });

        socket.emit('subscribeContracts', { contracts: data });
    }, 5000);
    setInterval(async function () {
        const increase = await top.increase(5);
        const decrease = await top.increase(5);
        const volume = await top.increase(5);
        socket.emit('market', {
            increase,
            decrease,
            volume,
        });
    }, 5000);
    socket.on('subscribe', name => {
        subscribeContracts.add(name)
    });
    socket.on('unsubscribe', name => {
        subscribeContracts.delete(name)
    });
    socket.on('resubscribe', contracts => {
        subscribeContracts.clear();
        contracts.forEach((c: Contract) => {
            subscribeContracts.add(c);
        })
    });
    socket.on('testNotify', () => {
        socket.emit('test')
    })

})