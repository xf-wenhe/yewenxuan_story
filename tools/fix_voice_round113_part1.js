const fs = require('fs');
const path = require('path');

const CC1 = '嗓音干涩而粗糙。';
const CC2 = '嗓音干涩粗糙，整句话都吐不完整。';
const CC3 = '嗓音里全是沙砾的粗糙感。';
const CC4 = '嗓音压得极轻，';
const CC5 = '声音轻得快要散在空气里，';
const CC6 = '声音从电话里面传出来。';
const CC7 = '声音里面有一种东';
const CC8 = '声音里满是紧张。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;