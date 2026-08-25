const fs = require('fs');
const path = require('path');

const NN1 = '嗓音发哑';
const NN2 = '视线凝定';
const NN3 = '嗓音发粗';
const NN4 = '视线凝锁';
const NN5 = '目光投去';
const NN6 = '声调之内';
const NN7 = '声调之外';
const NN8 = '声调无波';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;