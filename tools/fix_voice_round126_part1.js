const fs = require('fs');
const path = require('path');

const NN1 = '语气平淡得不像活人';
const NN2 = '语气平淡得没有感情';
const NN3 = '语气平淡得让人发冷';
const NN4 = '语气像尺子量过一样均匀';
const NN5 = '语气从头到尾没有起落';
const NN6 = '语气平稳得像一潭死水';
const NN7 = '语气没有波动';
const NN8 = '语气平直无波';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;