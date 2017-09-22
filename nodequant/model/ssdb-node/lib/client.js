// Nodejs client for https://github.com/ideawu/ssdb

'use strict';

const net         = require('net');
const util        = require('util');
const createError = require('create-error.js');
const Parser      = require('./parser');

// Errors
// ssdb base error
const BaseError              = createError('BaseError', Error);
// thrown when socket error occurs
const SocketError            = createError('SocketError', BaseError);
// thrown when connection error occurs
const ConnectionError        = createError('ConnectionError', SocketError);
// thrown when connection is refused
const ConnectionRefusedError = createError('ConnectionRefusedError', ConnectionError);
// thrown when connection is timed out
const TimeoutError           = createError('TimeoutError', SocketError);
// thrown when ssdb command error occurs
const SSDBError              = createError('SSDBError', BaseError);
// thrown when ssdb command fails
const FailError              = createError('FailError', SSDBError);
// thrown when ssdb command error occurs on client side
const ClientError            = createError('ClientError', SSDBError);
// thrown when ssdb command error occurs on server side
const ServerError            = createError('ServerError', SSDBError);

// Cast responsed strings to Javascript types
const conversions = {
  int: function(list) {
    return parseInt(list[0], 10);
  },
  float: function(list) {
    return parseFloat(list[0]);
  },
  str: function(list) {
    return list[0];
  },
  bool: function(list) {
    return !!parseInt(list[0], 10);
  },
  list: function(list) {
    return list;
  }
};

// All avaliable commands
const commands = {
  set               : 'int',
  setx              : 'int',
  expire            : 'int',
  ttl               : 'int',
  setnx             : 'int',
  get               : 'str',
  getset            : 'str',
  del               : 'int',
  incr              : 'int',
  exists            : 'bool',
  getbit            : 'int',
  setbit            : 'int',
  countbit          : 'int',
  substr            : 'str',
  strlen            : 'int',
  keys              : 'list',
  scan              : 'list',
  rscan             : 'list',
  multi_set         : 'int',
  multi_get         : 'list',
  multi_del         : 'int',
  hset              : 'int',
  hget              : 'str',
  hdel              : 'int',
  hincr             : 'int',
  hexists           : 'bool',
  hsize             : 'int',
  hlist             : 'list',
  hrlist            : 'list',
  hkeys             : 'list',
  hgetall           : 'list',
  hscan             : 'list',
  hrscan            : 'list',
  hclear            : 'int',
  multi_hset        : 'int',
  multi_hget        : 'list',
  multi_hdel        : 'int',
  zset              : 'int',
  zget              : 'int',
  zdel              : 'int',
  zincr             : 'int',
  zexists           : 'bool',
  zsize             : 'int',
  zlist             : 'list',
  zrlist            : 'list',
  zkeys             : 'list',
  zscan             : 'list',
  zrscan            : 'list',
  zrank             : 'int',
  zrrank            : 'int',
  zrange            : 'list',
  zrrange           : 'list',
  zclear            : 'int',
  zcount            : 'int',
  zsum              : 'int',
  zavg              : 'float',
  zremrangebyrank   : 'int',
  zremrangebyscore  : 'int',
  multi_zset        : 'int',
  multi_zget        : 'list',
  multi_zdel        : 'int',
  qsize             : 'int',
  qclear            : 'int',
  qfront            : 'str',
  qback             : 'str',
  qget              : 'str',
  qslice            : 'list',
  qpush             : 'int',
  qpush_front       : 'int',
  qpush_back        : 'int',
  qpop              : 'str',
  qpop_front        : 'str',
  qpop_back         : 'str',
  qlist             : 'list',
  qrlist            : 'list',
  dbsize            : 'int',
  info              : 'list',
  auth              : 'bool',
    request:'list',
    nrrange:"list",
    nlist:"list",
    nset:"int"
};

// Connection object
class Connection {
    constructor(options) {
        this.port = options.port || 8888;
        this.host = options.host || '0.0.0.0';
        this.auth = options.auth;  // default: undefined
        this.authCallback = options.authCallback ||
            function (err, data) {
                if (err) throw err;
            };
        this.timeout = options.timeout || 0;  // default: 0

        this.sock = null;
        this.callbacks = [];
        this.commands = [];
        this.parser = new Parser();
        this.parent = options.parent;
    }

    connect(callback) {
        this.sock = net.Socket();
        this.sock.setTimeout(this.timeout);
        this.sock.setEncoding('utf8');
        this.sock.setNoDelay(true);
        this.sock.setKeepAlive(true);
        this.sock.connect(this.port, this.host, callback);
        let self = this;
        // register listeners
        this.sock.on('data', function (buf) {
            return self.onReceived(buf);
        });
        this.sock.on('error', function (err) {
            let error = null;
            if (err.code === 'ECONNREFUSED') {
                error = new ConnectionRefusedError(err);
            } else {
                error = new ConnectionError(err);
            }

            if (self.parent._promisify){
                let callback = self.callbacks.shift();
                self.commands.shift();
                callback(error, undefined);
            }
            else{
                throw error;
            }
        });
        this.sock.on('timeout', function (err) {
            let error = new TimeoutError(err);
            if (self.parent._promisify){
                let callback = self.callbacks.shift();
                self.commands.shift();
                callback(error, undefined);
            }
            else{
                throw error;
            }
        });
    };

    close() {
        if (this.sock) {
            this.sock.end();
            this.sock.destroy();
            this.sock = null;
        }
        if (this.parser) {
            this.parser.clear();
        }
    }

    compile(cmd, params) {
        let args = [];
        let list = [];
        let pattern = '%d\n%s\n';

        args.push(cmd);
        [].push.apply(args, params);

        for (let i = 0; i < args.length; i++) {
            let arg = args[i];
            let bytes = Buffer.byteLength(util.format('%s', arg));
            list.push(util.format(pattern, bytes, arg));
        }

        list.push('\n');
        return new Buffer(list.join(''));
    };

    send(cmd, params) {
        let buf = this.compile(cmd, params);
        // lazy connect
        if (!this.sock) {
            let self = this;
            return this.connect(function() {
                if (typeof self.auth !== 'undefined') {
                    // auth on the first command
                    let cmd = 'auth';
                    let params = [self.auth];
                    self.commands.unshift(cmd);
                    self.callbacks.unshift(self.authCallback);
                    self.send(cmd, params);
                }
                // tcp guarantees this `write` orders after `auth`
                self.sock.write(buf);
            });
        } else {
            return this.sock.write(buf);
        }
    };

    buildValue(type, list) {
        return conversions[type](list);
    };

    buildError(status, command) {
        return util.format('%s on command \'%s\'', status, command);
    };

    onReceived(buf) {
        let response;
        let responses = [];
        this.parser.feed(buf);

        while ((response = this.parser.get()) !== undefined) {
            responses.push(response);
        }

        let self = this;
        responses.forEach(function (response) {
            let error;
            let data;

            let status = response[0];
            let body = response.slice(1);
            let command = self.commands.shift();

            // build value
            switch (status) {
                case 'ok':
                    let type = commands[command] || 'str';
                    data = self.buildValue(type, body);
                    break;
                case 'not_found':
                    // do nothing, err: undefined, data: undefined
                    break;
                case 'client_error':
                    error = new ClientError(self.buildError(status, command));
                    break;
                case 'fail':
                    error = new FailError(self.buildError(status, command));
                    break;
                case 'server_error':
                    error = new ServerError(self.buildError(status, command));
                    break;
                case 'error':
                default:
                    // build error
                    error = new SSDBError(self.buildError(status, command));
                    break;
            }

            // call callback
            let callback = self.callbacks.shift();
            if (self.callbacks.length !== 0){
                console.error("ssdb client Error, have a callback no response and delete this callback!");
            }
            if (self.parent != null){
                let index = self.parent._busyConn.indexOf(self);
                if (index >= 0){
                    self.parent._busyConn.splice(index, 1);
                }
                self.parent._idleConn.push(self);
                self.parent._checkResume();
            }

            if (callback) {
                callback(error, data);
            }

        });
    };

    request(cmd, params, callback) {
        this.commands.push(cmd);
        this.callbacks.push(callback);
        return this.send(cmd, params);
    };
}


class Client {
    constructor(options) {
        this._idleConn = [];
        this._busyConn = [];
        this._waitSend = [];
        this._promisify = options.promisify || false;
        this._promisifyMap = {};
        this._id = 0;
        options.parent = this;
        for (let i = 0; i < (options.size || 1); ++i)
            this._idleConn.push(new Connection(options))

        this._registerCmdList();
    }

    _registerCmdList() {
        let self = this;

        for (let cmd in commands) {
            (function(cmd) {
                self[cmd] = function() {
                    let cb;
                    let params=[];
                    if(cmd=="multi_hget"||cmd=="nrrange"||cmd=="nlist"||cmd=="nset")
                    {
                        params = arguments[0];
                    }else
                    {
                        params = [].slice.call(arguments, 0, -1);
                    }
                    let last = [].slice.call(arguments, -1)[0];

                    if (typeof last === 'function') {
                        cb = last;
                    }else {
                        params.push(last);
                    }

                    let key = self._id;
                    if (self._promisify){
                        cb = function (err, data) {
                            let resolve = self._promisifyMap[key][0];
                            let reject = self._promisifyMap[key][1];
                            delete self._promisifyMap[key];
                            if (err) {
                                return reject(err);
                            }
                            else {
                                return resolve(data);
                            }
                        }.bind(key);
                        self._id = (self._id + 1) % 1000000000;
                    }

                    self._waitSend.push([cmd, params, cb]);
                    let ret = undefined;
                    if (self._promisify) {
                        ret = new Promise(function (resolve, reject) {
                            self._promisifyMap[key] = [resolve, reject];
                        });
                    }
                    self._checkResume();
                    return ret;

                };
            })(cmd);
        }
        return self;
    };

    _checkResume(){
        while (this._idleConn.length > 0 && this._waitSend.length > 0){
            let conn = this._idleConn.shift();
            let req = this._waitSend.shift();
            this._busyConn.push(conn);
            conn.request(req[0], req[1], req[2]);
        }
    }

    close() {
        this._waitSend = [];
        for (let conn in this._busyConn){
            this._busyConn[conn].close();
        }
        for (let conn in this._idleConn){
            this._idleConn[conn].close();
        }
    };
}


exports = module.exports = Client;


