const fs = require('fs');
const path = require('path');

const NN1 = '嗓音喑暗';
const NN2 = '嗓音低沉';
const NN3 = '嗓音发暗';
const NN4 = '嗓音低回';
const NN5 = '目光停住';
const NN6 = '目光投过';
const NN7 = '视线锁住';
const NN8 = '目光扫向';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;