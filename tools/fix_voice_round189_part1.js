const fs = require('fs');
const path = require('path');

const NN1 = '嗓音低沉';
const NN2 = '视线收紧';
const NN3 = '目光固定';
const NN4 = '注视收紧';
const NN5 = '视线凝固';
const NN6 = '声调低弱';
const NN7 = '声线低弱';
const NN8 = '嗓音颤动';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;