const fs = require('fs');
const path = require('path');

const NN1 = '嗓音发哑';
const NN2 = '嗓音发寒';
const NN3 = '嗓音沙哑';
const NN4 = '嗓音发涩';
const NN5 = '声调不变';
const NN6 = '声调平白';
const NN7 = '视线凝滞';
const NN8 = '目光定住';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;