/**
 * Created by Administrator on 2017/6/12.
 */

let CtpClient=undefined;

if(process.platform==="win32" && process.arch==="x64")
{
    CtpClient=require("./CTPClient");
}else if(process.platform==="linux" && process.arch==="x64")
{
    CtpClient=require("./CTPClient");
}else
{
    console.error("CtpClient is undefine!!!CtpClient Only Support Windows Node.js-"+process.version+"-64bit/Linux x64 Node.js ");
}

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
                if(CtpClient)
                {
                    TradingClient = new CtpClient(clientName);
                    console.log("CtpClient Created");
                }
                break;
            default:
                break;
        }

        return TradingClient;
    }
}

module.exports=ClientFactory;