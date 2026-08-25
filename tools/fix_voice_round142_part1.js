const fs = require('fs');
const path = require('path');

const NN1 = '声调中';
const NN2 = '声调内';
const NN3 = '目光凝住';
const NN4 = '嗓音粗哑';
const NN5 = '视线移去';
const NN6 = '目光转开';
const NN7 = '声调平直';
const NN8 = '视线定住';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;