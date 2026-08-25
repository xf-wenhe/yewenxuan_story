const fs = require('fs');
const path = require('path');

const NN1 = '嗓音低哑';
const NN2 = '嗓音低暗';
const NN3 = '嗓音发暗';
const NN4 = '嗓音喑哑';
const NN5 = '视线凝住';
const NN6 = '视线凝定';
const NN7 = '目光扫过';
const NN8 = '声调未改';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;