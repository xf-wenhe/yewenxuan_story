const fs = require('fs');
const path = require('path');

const NN1 = '视线不转';
const NN2 = '视线未移';
const NN3 = '视线未动';
const NN4 = '视线固定';
const NN5 = '声调没改';
const NN6 = '声调未改';
const NN7 = '音色未变';
const NN8 = '声调没变';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;