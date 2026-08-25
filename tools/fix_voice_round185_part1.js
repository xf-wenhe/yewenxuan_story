const fs = require('fs');
const path = require('path');

const NN1 = '声调持平';
const NN2 = '声调平静';
const NN3 = '声调平展';
const NN4 = '声调平适';
const NN5 = '嗓音颤动';
const NN6 = '嗓音发抖';
const NN7 = '嗓子发颤';
const NN8 = '嗓音的底色';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;