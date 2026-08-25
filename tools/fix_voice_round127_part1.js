const fs = require('fs');
const path = require('path');

const NN1 = '嗓音平淡无波';
const NN2 = '嗓音沉得到极';
const NN3 = '声音低沉得轻之又轻';
const NN4 = '说话平直';
const NN5 = '声音稳得连半';
const NN6 = '嗓音没有起伏';
const NN7 = '嗓音毫无波澜';
const NN8 = '语气平淡得像机器';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;