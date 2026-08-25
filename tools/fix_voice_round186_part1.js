const fs = require('fs');
const path = require('path');

const NN1 = '声音低沉';
const NN2 = '声线低沉';
const NN3 = '声线低弱';
const NN4 = '声线平展';
const NN5 = '声线低缓';
const NN6 = '语气平淡';
const NN7 = '嗓子颤振';
const NN8 = '视线凝望';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;