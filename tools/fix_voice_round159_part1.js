const fs = require('fs');
const path = require('path');

const NN1 = '声调平直';
const NN2 = '声调之间';
const NN3 = '声调里';
const NN4 = '声调间';
const NN5 = '嗓音发涩';
const NN6 = '声调寡淡';
const NN7 = '视线定住';
const NN8 = '视线凝住';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;