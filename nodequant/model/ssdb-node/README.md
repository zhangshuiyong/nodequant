SSDB NodeJS 客户端
=================

1. 基于https://github.com/eleme/node-ssdb 改写；
2. 主要是修复了上述客户端的请求和应答对应错误的问题；

```shell
npm install ssdb-node --save
```

Example

```js

'use strict';
const co = require('co');
const ssdb = require("./lib/client");
const options = {
    host: '127.0.0.1',
    port: 8888,
    promisify: true,
    size: 3
};

let client = new ssdb(options);


function* main() {
    console.info(yield Promise.all([
        client.hget("test-ssdb-client", "key1"),
        client.hget("test-ssdb-client", "key2"),
        client.hget("test-ssdb-client", "key1"),
        client.hget("test-ssdb-client", "key1"),
        client.hget("test-ssdb-client", "key1"),
        client.hget("test-ssdb-client", "key1"),
        client.hget("test-ssdb-client", "key2"),
        client.hget("test-ssdb-client", "key1"),
        client.hget("test-ssdb-client", "key1")
    ]).catch(function (error) {
        console.error(error)
    }));
}

co(main());

```
