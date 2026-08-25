const fs = require('fs');
const path = require('path');

const NN1 = '语气平淡';
const NN2 = '声音没有起伏';
const NN3 = '声音有些发抖';
const NN4 = '语气平缓无起伏';
const NN5 = '声音发颤';
const NN6 = '嗓音沙哑';
const NN7 = '声音有些颤';
const NN8 = '语气冰冷';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;