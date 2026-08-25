const fs = require('fs');
const path = require('path');

const NN1 = '嗓音喑然';
const NN2 = '嗓音喑沉';
const NN3 = '嗓音喑喑';
const NN4 = '嗓音喑哑';
const NN5 = '目光锁住';
const NN6 = '目光钉住';
const NN7 = '视线锁定';
const NN8 = '目光挪开';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;