const fs = require('fs');
const path = require('path');

const NN1 = '声音轻得';
const NN2 = '声音很平';
const NN3 = '声音压至';
const NN4 = '嗓音压';
const NN5 = '声音沉得很低';
const NN6 = '嗓音绷得';
const NN7 = '声音落到了底';
const NN8 = '嗓音冷';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;