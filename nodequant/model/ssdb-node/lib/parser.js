"use strict";

class Parse{
    feed(buf) {
        if (typeof this.buf === 'undefined') {
            this.buf = new Buffer(buf);
        } else {
            this.buf = Buffer.concat([this.buf, new Buffer(buf)]);
        }
    };

    get() {
        let len = this.buf.length;
        let ptr = 0;
        let ch = 0;
        let chunk = [];

        while (len > 0) {
            ch = [].indexOf.apply(this.buf, [10, ptr]);

            if (ch < 0)
                break;

            ch += 1;

            let dis = ch - ptr;

            if (dis === 1 || (dis === 2 && this.buf[ptr] === 13)) {
                this.buf = this.buf.slice(ch);
                return chunk;
            }

            let sz = parseInt(this.buf.slice(ptr, ch), 10);

            len -= dis + sz;
            ptr += dis + sz;

            if (len < 0) break;

            if (len >= 1 && this.buf[ptr] === 10) {
                len -= 1;
                ptr += 1;
            } else if (len >= 2 && this.buf[ptr] === 13 && this.buf[ptr + 1] === 10) {
                len -= 2;
                ptr += 2;
            } else {
                break;
            }

            chunk.push(this.buf.slice(ch, ch + sz).toString());
        }
    };

    clear() {
        this.buf = new Buffer('');
    }
}


module.exports = Parse;