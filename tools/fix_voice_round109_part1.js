const fs = require('fs');
const path = require('path');

const X1 = '声音沉了下去。';
const X2 = '声音郑重得不带一丝玩笑，';
const X3 = '声线轻得像一缕烟，';
const X4 = '声调陡然沉了下去。';
const X5 = '声线压到了最底。';
const X6 = '嗓音冷静得不带任何情感。';
const X7 = '嗓音冷静得出奇。';
const X8 = '嗓音从头到尾没有起伏。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;