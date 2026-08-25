const fs = require('fs');
const path = require('path');

const NN1 = '声调低哑';
const NN2 = '声线低闷';
const NN3 = '目光凝定';
const NN4 = '音色低弱';
const NN5 = '音色低闷';
const NN6 = '视线凝住';
const NN7 = '视线凝定';
const NN8 = '视线收住';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;