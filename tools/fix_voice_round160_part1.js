const fs = require('fs');
const path = require('path');

const NN1 = '声调之外';
const NN2 = '视线凝望';
const NN3 = '视线凝滞';
const NN4 = '声调平白';
const NN5 = '声调平淡';
const NN6 = '声调之内';
const NN7 = '声调无波';
const NN8 = '嗓音沙哑';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;