const fs = require('fs');
const path = require('path');

const NN1 = '嗓音沙哑';
const NN2 = '目光移走';
const NN3 = '语气平淡';
const NN4 = '语气冷淡';
const NN5 = '声调无波';
const NN6 = '目光定住';
const NN7 = '嗓音发寒';
const NN8 = '嗓音低回';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;