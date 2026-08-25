const fs = require('fs');
const path = require('path');

const NN1 = '声调无波';
const NN2 = '目光停定';
const NN3 = '视线凝住';
const NN4 = '眼定住';
const NN5 = '声调之内';
const NN6 = '嗓音发涩';
const NN7 = '声调之外';
const NN8 = '声调平淡';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;