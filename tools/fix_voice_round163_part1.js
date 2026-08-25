const fs = require('fs');
const path = require('path');

const NN1 = '声调寡淡';
const NN2 = '声调平淡';
const NN3 = '嗓音发涩';
const NN4 = '声调平白';
const NN5 = '视线凝望';
const NN6 = '嗓音沙哑';
const NN7 = '视线凝滞';
const NN8 = '声调之间';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;