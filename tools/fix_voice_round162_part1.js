const fs = require('fs');
const path = require('path');

const NN1 = '嗓音低沉';
const NN2 = '声调之内';
const NN3 = '视线凝住';
const NN4 = '声调无波';
const NN5 = '声调之外';
const NN6 = '声调平直';
const NN7 = '视线定住';
const NN8 = '嗓音暗哑';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;