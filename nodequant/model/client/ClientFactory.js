/**
 * Created by Administrator on 2017/6/12.
 */

let CtpClient=require("./CTPClient");
let SgitClient=require("./SgitClient");

class ClientFactory{
    constructor()
    {

    }

    static Create(clientName)
    {
        let TradingClient=undefined;
        switch(clientName)
        {
            case "CTP":
                TradingClient = new CtpClient(clientName);
                break;

            case "Sgit":
                TradingClient = new SgitClient(clientName);
                break;
            default:
                break;
        }

        return TradingClient;
    }
}

module.exports=ClientFactory;