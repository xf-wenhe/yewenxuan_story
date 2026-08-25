const fs = require('fs');
const path = require('path');

const NN1 = '嗓音喑然';
const NN2 = '嗓音喑沉';
const NN3 = '嗓音喑喑';
const NN4 = '嗓音低回';
const NN5 = '视线定住';
const NN6 = '目光投来';
const NN7 = '目光移去';
const NN8 = '语气无波';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;