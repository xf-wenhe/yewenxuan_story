const fs = require('fs');
const path = require('path');

const NN1 = '嗓音发寒';
const NN2 = '嗓音发哑';
const NN3 = '嗓音低哑';
const NN4 = '嗓音发涩';
const NN5 = '视线定住';
const NN6 = '目光定住';
const NN7 = '视线凝住';
const NN8 = '视线落定';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;