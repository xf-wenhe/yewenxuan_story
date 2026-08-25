const fs = require('fs');
const path = require('path');

const NN1 = '语调低缓';
const NN2 = '声调低弱';
const NN3 = '视线固定';
const NN4 = '音色低缓';
const NN5 = '视线不移';
const NN6 = '嗓音颤抖';
const NN7 = '声线低弱';
const NN8 = '目光不移';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;