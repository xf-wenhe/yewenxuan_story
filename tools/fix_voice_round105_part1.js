const fs = require('fs');
const path = require('path');

const SS1 = '声线里听不见半分波澜。。';
const SS2 = '声线里没有任何起伏。，';
const SS3 = '嗓音从头至尾没有半点儿波澜。。';
const SS4 = '嗓音干涩得没有任何感情色彩。。';
const SS5 = '嗓音没有任何起落。。';
const SS6 = '嗓音没有任何起落。，';
const SS7 = '声调降了下来。。';
const SS8 = '声调平稳得让人感觉不到情感。。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;