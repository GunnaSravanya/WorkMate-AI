/**
 * qr-generator.js - Fixed implementation for Type 10-L
 */
const QRCode = (function () {
    const PAD0 = 0xEC;
    const PAD1 = 0x11;
    const QRMode = { MODE_8BIT_BYTE: 4 };
    const QRErrorCorrectionLevel = { L: 1 };

    function QRUtil() {
        this.getPatternPosition = function (type) {
            if (type <= 1) return [];
            const pos = [
                [], // V1
                [6, 18],
                [6, 22],
                [6, 26],
                [6, 30],
                [6, 34],
                [6, 22, 38],
                [6, 24, 42],
                [6, 26, 46],
                [6, 28, 50]
            ];
            return pos[type - 1] || [6, 22];
        };
        this.getBCHTypeInfo = function (data) {
            let d = data << 10;
            while (this.getBCHDigit(d) - this.getBCHDigit(0x537) >= 0) {
                d ^= (0x537 << (this.getBCHDigit(d) - this.getBCHDigit(0x537)));
            }
            return ((data << 10) | d) ^ 0x5412;
        };
        this.getBCHDigit = function (data) {
            let d = 0;
            while (data !== 0) { d++; data >>>= 1; }
            return d;
        };
        this.getMask = function (maskPattern, i, j) {
            switch (maskPattern) {
                case 0: return (i + j) % 2 === 0;
                case 1: return i % 2 === 0;
                case 2: return j % 3 === 0;
                case 3: return (i + j) % 3 === 0;
                case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
                case 5: return (i * j) % 2 + (i * j) % 3 === 0;
                case 6: return ((i * j) % 2 + (i * j) % 3) % 2 === 0;
                case 7: return ((i * j) % 3 + (i + j) % 2) % 2 === 0;
                default: throw new Error("bad maskPattern:" + maskPattern);
            }
        };
        this.getErrorCorrectPolynomial = function (errorCorrectLength) {
            let a = new QRPolynomial([1], 0);
            for (let i = 0; i < errorCorrectLength; i++) {
                a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
            }
            return a;
        };
    }

    const QRMath = {
        gexp: function (n) {
            while (n < 0) n += 255;
            while (n >= 256) n -= 255;
            return QRMath.EXP_TABLE[n];
        },
        glog: function (n) {
            if (n < 1) throw new Error("glog(" + n + ")");
            return QRMath.LOG_TABLE[n];
        },
        EXP_TABLE: new Array(256),
        LOG_TABLE: new Array(256)
    };

    for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
    for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
    for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

    function QRPolynomial(num, shift) {
        let offset = 0;
        while (offset < num.length && num[offset] === 0) offset++;
        this.num = new Array(num.length - offset + shift);
        for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
        this.get = function (index) { return this.num[index]; };
        this.getLength = function () { return this.num.length; };
        this.multiply = function (e) {
            let num = new Array(this.getLength() + e.getLength() - 1);
            for (let i = 0; i < this.getLength(); i++) {
                for (let j = 0; j < e.getLength(); j++) {
                    num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
                }
            }
            return new QRPolynomial(num, 0);
        };
        this.mod = function (e) {
            if (this.getLength() - e.getLength() < 0) return this;
            let ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
            let num = new Array(this.getLength());
            for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
            for (let i = 0; i < e.getLength(); i++) {
                num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
            }
            return new QRPolynomial(num, 0).mod(e);
        };
    }

    function RSBlock(totalCount, dataCount) {
        this.totalCount = totalCount;
        this.dataCount = dataCount;
    }
    RSBlock.getRSBlocks = function (type) {
        // RS Blocks for Level L
        const table = [
            [26, 19],   // V1
            [44, 34],   // V2
            [70, 55],   // V3
            [100, 80],  // V4
            [134, 108], // V5
            [172, 136], // V6
            [196, 156], // V7
            [242, 194], // V8
            [292, 232], // V9
            [346, 274]  // V10
        ];
        if (type < 1 || type > 10) type = 4;
        const row = table[type - 1];
        return [new RSBlock(row[0], row[1])];
    };

    function QRBitBuffer() {
        this.buffer = [];
        this.length = 0;
        this.get = function (index) { return ((this.buffer[Math.floor(index / 8)] >>> (7 - index % 8)) & 1) === 1; };
        this.put = function (num, length) {
            for (let i = 0; i < length; i++) this.putBit(((num >>> (length - i - 1)) & 1) === 1);
        };
        this.putBit = function (bit) {
            let bufIndex = Math.floor(this.length / 8);
            if (this.buffer.length <= bufIndex) this.buffer.push(0);
            if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
            this.length++;
        };
    }

    function qrcode(typeNumber, errorCorrectionLevel) {
        const util = new QRUtil();
        typeNumber = typeNumber || 10;
        errorCorrectionLevel = errorCorrectionLevel || 'L';
        let modules = null;
        let moduleCount = 0;
        let dataList = [];

        const obj = {};
        obj.addData = function (data) { dataList.push(data); };
        obj.make = function () {
            moduleCount = typeNumber * 4 + 17;
            modules = new Array(moduleCount);
            for (let row = 0; row < moduleCount; row++) {
                modules[row] = new Array(moduleCount);
                for (let col = 0; col < moduleCount; col++) modules[row][col] = null;
            }
            setupPositionProbePattern(0, 0);
            setupPositionProbePattern(moduleCount - 7, 0);
            setupPositionProbePattern(0, moduleCount - 7);
            setupPositionAdjustPattern();
            setupTimingPattern();
            setupTypeInfo(false, 0);
            mapData(createData(typeNumber, errorCorrectionLevel, dataList), 0);
        };

        const setupPositionProbePattern = (row, col) => {
            for (let r = -1; r <= 7; r++) {
                if (row + r <= -1 || moduleCount <= row + r) continue;
                for (let c = -1; c <= 7; c++) {
                    if (col + c <= -1 || moduleCount <= col + c) continue;
                    if ((0 <= r && r <= 6 && (c === 0 || c === 6)) || (0 <= c && c <= 6 && (r === 0 || r === 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4)) modules[row + r][col + c] = true;
                    else modules[row + r][col + c] = false;
                }
            }
        };

        const setupTimingPattern = () => {
            for (let r = 8; r < moduleCount - 8; r++) { if (modules[r][6] != null) continue; modules[r][6] = (r % 2 === 0); }
            for (let c = 8; c < moduleCount - 8; c++) { if (modules[6][c] != null) continue; modules[6][c] = (c % 2 === 0); }
        };

        const setupPositionAdjustPattern = () => {
            const pos = util.getPatternPosition(typeNumber);
            for (let i = 0; i < pos.length; i++) {
                for (let j = 0; j < pos.length; j++) {
                    let row = pos[i], col = pos[j];
                    if (modules[row][col] != null) continue;
                    for (let r = -2; r <= 2; r++) {
                        for (let c = -2; c <= 2; c++) {
                            if (Math.max(Math.abs(r), Math.abs(c)) === 2) modules[row + r][col + c] = true;
                            else if (Math.max(Math.abs(r), Math.abs(c)) === 1) modules[row + r][col + c] = false;
                            else modules[row + r][col + c] = true;
                        }
                    }
                }
            }
        };

        const setupTypeInfo = (test, maskPattern) => {
            const data = (QRErrorCorrectionLevel[errorCorrectionLevel] << 3) | maskPattern;
            const bits = util.getBCHTypeInfo(data);
            for (let i = 0; i < 15; i++) {
                let mod = (!test && ((bits >> i) & 1) === 1);
                if (i < 6) modules[i][8] = mod;
                else if (i < 8) modules[i + 1][8] = mod;
                else modules[moduleCount - 15 + i][8] = mod;
                if (i < 8) modules[8][moduleCount - i - 1] = mod;
                else if (i < 9) modules[8][15 - i - 1 + 1] = mod;
                else modules[8][15 - i - 1] = mod;
            }
            modules[moduleCount - 8][8] = !test;
        };

        const mapData = (data, maskPattern) => {
            let inc = -1, row = moduleCount - 1, bitIndex = 7, byteIndex = 0;
            for (let col = moduleCount - 1; col > 0; col -= 2) {
                if (col === 6) col--;
                while (true) {
                    for (let c = 0; c < 2; c++) {
                        if (modules[row][col - c] == null) {
                            let dark = false;
                            if (byteIndex < data.length) dark = (((data[byteIndex] >>> bitIndex) & 1) === 1);
                            if (util.getMask(maskPattern, row, col - c)) dark = !dark;
                            modules[row][col - c] = dark;
                            bitIndex--;
                            if (bitIndex === -1) { byteIndex++; bitIndex = 7; }
                        }
                    }
                    row += inc;
                    if (row < 0 || moduleCount <= row) { row -= inc; inc = -inc; break; }
                }
            }
        };

        const createData = (type, ecLevel, dataList) => {
            const rsBlocks = RSBlock.getRSBlocks(type);
            const buffer = new QRBitBuffer();
            for (let i = 0; i < dataList.length; i++) {
                buffer.put(QRMode.MODE_8BIT_BYTE, 4);
                buffer.put(dataList[i].length, 8);
                for (let j = 0; j < dataList[i].length; j++) buffer.put(dataList[i].charCodeAt(j), 8);
            }
            let totalDataCount = 0;
            for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;
            if (buffer.length > totalDataCount * 8) throw new Error("code length overflow: " + buffer.length + " > " + (totalDataCount * 8));
            if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
            while (buffer.length % 8 !== 0) buffer.putBit(false);
            while (true) {
                if (buffer.length >= totalDataCount * 8) break;
                buffer.put(PAD0, 8);
                if (buffer.length >= totalDataCount * 8) break;
                buffer.put(PAD1, 8);
            }
            return createBytes(buffer, rsBlocks);
        };

        const createBytes = (buffer, rsBlocks) => {
            let offset = 0, maxDcCount = 0, maxEcCount = 0;
            const dcdata = new Array(rsBlocks.length), ecdata = new Array(rsBlocks.length);
            for (let r = 0; r < rsBlocks.length; r++) {
                let dcCount = rsBlocks[r].dataCount, ecCount = rsBlocks[r].totalCount - dcCount;
                maxDcCount = Math.max(maxDcCount, dcCount);
                maxEcCount = Math.max(maxEcCount, ecCount);
                dcdata[r] = new Array(dcCount);
                for (let i = 0; i < dcdata[r].length; i++) dcdata[r][i] = 0xff & buffer.buffer[i + offset];
                offset += dcCount;
                let rsPoly = util.getErrorCorrectPolynomial(ecCount);
                let rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
                let modPoly = rawPoly.mod(rsPoly);
                ecdata[r] = new Array(rsPoly.getLength() - 1);
                for (let i = 0; i < ecdata[r].length; i++) {
                    let modIndex = i + modPoly.getLength() - ecdata[r].length;
                    ecdata[r][i] = (modIndex >= 0) ? modPoly.get(modIndex) : 0;
                }
            }
            let totalCodeCount = 0;
            for (let i = 0; i < rsBlocks.length; i++) totalCodeCount += rsBlocks[i].totalCount;
            const data = new Array(totalCodeCount);
            let index = 0;
            for (let i = 0; i < maxDcCount; i++) { for (let r = 0; r < rsBlocks.length; r++) { if (i < dcdata[r].length) data[index++] = dcdata[r][i]; } }
            for (let i = 0; i < maxEcCount; i++) { for (let r = 0; r < rsBlocks.length; r++) { if (i < ecdata[r].length) data[index++] = ecdata[r][i]; } }
            return data;
        };

        obj.createImgTag = function (cellSize, margin) {
            cellSize = cellSize || 4;
            margin = margin || cellSize * 4;
            let size = moduleCount * cellSize + margin * 2;
            let canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            let ctx = canvas.getContext('2d');
            ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = "#000000";
            for (let r = 0; r < moduleCount; r++) {
                for (let c = 0; c < moduleCount; c++) { if (modules[r][c]) ctx.fillRect(c * cellSize + margin, r * cellSize + margin, cellSize, cellSize); }
            }
            return canvas.toDataURL();
        };

        return obj;
    }

    return qrcode;
})();

export default QRCode;
