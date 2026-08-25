const fs = require('fs');
const path = require('path');

const RR1 = '嗓音干涩粗糙，几乎说不出整句。，';
const RR2 = '嗓音干涩粗糙。，';
const RR3 = '嗓音像被砂砾反复摩擦。，';
const RR4 = '嗓音冷静而寡淡。。';
const RR5 = '嗓音沙哑而低沉。';
const RR6 = '嗓音粗哑不堪。，';
const RR7 = '嗓音干涩得让人明显察觉到异常。，';
const RR8 = '嗓音说话。。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;