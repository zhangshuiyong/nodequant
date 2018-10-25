/**
 * Created by Administrator on 2017/6/12.
 */

let CtpClient=undefined;

if(process.platform=="win32" && process.arch=="ia32"){
    CtpClient=require("./CTPClient");
}else if(process.platform==="win32" && process.arch==="x64")
{
    CtpClient=require("./CTPClient");
}else if(process.platform==="linux" && process.arch==="x64")
{
    CtpClient=require("./CTPClient");
}else
{
    console.error("CtpClient is undefine!!!CtpClient Only Support Windows Node.js-"+process.version+"-32bit/Windows Node.js-"+process.version+"-64bit/Linux x64 Node.js"+process.version);
}
/*
let SgitClient=undefined;
if(process.platform==="win32" && process.arch==="ia32"){
    SgitClient=require("./SgitClient");
}else if(process.platform==="linux" && process.arch==="x64")
{
    SgitClient=require("./SgitClient");
}else
{
    console.error("SgitClient is undefine!!!SgitClient Only Support Windows Node.js-"+process.version+"-32bit/Linux x64 Node.js-"+process.version);
}
*/

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

            case "Sgit":
                if(SgitClient)
                {
                    TradingClient = new SgitClient(clientName);
                    console.log("SgitClient Created");
                }
                break;
            default:
                break;
        }

        return TradingClient;
    }
}

module.exports=ClientFactory;