const fs = require('fs');
const path = require('path');

const BB1 = '嗓音干涩如砂砾互相摩擦。';
const BB2 = '嗓音粗糙得像砂砾反复摩擦。';
const BB3 = '嗓音冷静，寡淡得不像话。';
const BB4 = '嗓音，连完整句子都困难。';
const BB5 = '嗓音被沙砾的粗糙填满。';
const BB6 = '嗓音像砂砾摩擦，难听得紧。';
const BB7 = '嗓音粗糙得像掺了沙粒。';
const BB8 = '嗓音像砂砾反复摩擦。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;