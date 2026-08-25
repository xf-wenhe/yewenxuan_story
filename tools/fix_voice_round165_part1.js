const fs = require('fs');
const path = require('path');

const NN1 = '声调无动';
const NN2 = '声调未改';
const NN3 = '声调低平';
const NN4 = '声调不变';
const NN5 = '嗓音喑哑';
const NN6 = '视线定住';
const NN7 = '视线凝住';
const NN8 = '嗓音低沉';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;