const fs = require('fs');
const path = require('path');

const NN1 = '语气平淡得';
const NN2 = '嗓音干涩得没';
const NN3 = '声音稳得没有';
const NN4 = '语气平铺直叙';
const NN5 = '声音有些颤抖';
const NN6 = '嗓音低得几近无声';
const NN7 = '声音没有半点';
const NN8 = '嗓音平得毫无波澜';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;