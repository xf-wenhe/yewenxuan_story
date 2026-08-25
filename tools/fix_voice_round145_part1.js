const fs = require('fs');
const path = require('path');

const NN1 = '声调内';
const NN2 = '嗓音沙哑';
const NN3 = '嗓音发涩';
const NN4 = '眼停住';
const NN5 = '声调平白';
const NN6 = '声调之内';
const NN7 = '声调里';
const NN8 = '眼凝定';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;