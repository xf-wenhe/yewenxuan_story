const fs = require('fs');
const path = require('path');

const NN1 = '声音的质地';
const NN2 = '目光锁定';
const NN3 = '声音微抖';
const NN4 = '声调低平';
const NN5 = '声调无波';
const NN6 = '声调平缓';
const NN7 = '过了片刻';
const NN8 = '声音的底色';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;