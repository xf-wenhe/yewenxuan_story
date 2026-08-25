const fs = require('fs');
const path = require('path');

const NN1 = '嗓音喑哑';
const NN2 = '声调平淡';
const NN3 = '嗓音低沉';
const NN4 = '嗓音暗哑';
const NN5 = '嗓音喑暗';
const NN6 = '目光投向';
const NN7 = '声调寡淡';
const NN8 = '目光凝住';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;