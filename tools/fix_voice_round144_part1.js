const fs = require('fs');
const path = require('path');

const NN1 = '声调间';
const NN2 = '声调间里';
const NN3 = '目光停住';
const NN4 = '声调中';
const NN5 = '声调无波';
const NN6 = '目光转去';
const NN7 = '嗓音哑了';
const NN8 = '嗓音暗哑';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;