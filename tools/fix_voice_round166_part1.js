const fs = require('fs');
const path = require('path');

const NN1 = '声调平直';
const NN2 = '嗓音低哑';
const NN3 = '嗓音发暗';
const NN4 = '视线凝持';
const NN5 = '嗓音暗哑';
const NN6 = '视线凝滞';
const NN7 = '目光移开';
const NN8 = '目光转向';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;