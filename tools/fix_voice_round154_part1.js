const fs = require('fs');
const path = require('path');

const NN1 = '声调无波';
const NN2 = '目光钉住';
const NN3 = '眼望向';
const NN4 = '目光移去';
const NN5 = '视线凝定';
const NN6 = '声调平白';
const NN7 = '声调平淡';
const NN8 = '嗓音哑了';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;