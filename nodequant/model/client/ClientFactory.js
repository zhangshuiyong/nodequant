/**
 * Created by Administrator on 2017/6/12.
 */

let CtpClient=undefined;

if(process.platform=="win32" && process.arch=="ia32"){
    CtpClient=require("./CTPClient");
}else if(process.platform=="win32" && process.arch=="x64")
{
    CtpClient=require("./CTPClient");
}else if(process.platform=="linux" && process.arch=="x64")
{
    CtpClient=require("./CTPClient");
}else
{
    console.error("CtpClient is undefine!!!CtpClient Only Support Windows Node.js-v6-32bit/Windows Node.js-v6-64bit/Linux Node.js-v6-64bit");
}

let SgitClient=undefined;
if(process.platform=="win32" && process.arch=="ia32"){
    SgitClient=require("./SgitClient");
}else if(process.platform=="linux" && process.arch=="x64")
{
    SgitClient=require("./SgitClient");
}else
{
    console.error("SgitClient is undefine!!!SgitClient Only Support Windows Node.js-v6-32bit/Linux Node.js-v6-64bit");
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
                }
                break;

            case "Sgit":
                if(SgitClient)
                {
                    TradingClient = new SgitClient(clientName);
                }
                break;
            default:
                break;
        }

        return TradingClient;
    }
}

module.exports=ClientFactory;