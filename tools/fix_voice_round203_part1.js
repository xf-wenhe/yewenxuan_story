const fs = require('fs');
const path = require('path');

const NN1 = '目光定着';
const NN2 = '视线未移';
const NN3 = '视线未动';
const NN4 = '视线固定';
const NN5 = '视线不动';
const NN6 = '目光凝住';
const NN7 = '声调未改';
const NN8 = '视线收住';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;