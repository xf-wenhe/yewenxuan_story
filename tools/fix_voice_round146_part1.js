const fs = require('fs');
const path = require('path');

const NN1 = '眼凝滞';
const NN2 = '眼停定';
const NN3 = '声调之外';
const NN4 = '声调间';
const NN5 = '眼定住';
const NN6 = '嗓音涩了';
const NN7 = '嗓音带涩';
const NN8 = '声调寡淡';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;