const fs = require('fs');
const path = require('path');

const AA1 = '嗓音粗哑得让人难受。';
const AA2 = '嗓音粗哑，难以入口。';
const AA3 = '嗓音，句子都说不全。';
const AA4 = '嗓音干涩，又粗糙。';
const AA5 = '嗓音，干涩得刺耳。';
const AA6 = '嗓音里满是沙粒的粗糙。';
const AA7 = '嗓音粗糙而干涩。';
const AA8 = '嗓音干涩，明显有异常。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;