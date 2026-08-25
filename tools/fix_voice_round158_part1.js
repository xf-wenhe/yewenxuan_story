const fs = require('fs');
const path = require('path');

const NN1 = '声调之内';
const NN2 = '嗓音暗哑';
const NN3 = '目光挪开';
const NN4 = '声调无波';
const NN5 = '眼望向';
const NN6 = '视线移开';
const NN7 = '视线离开';
const NN8 = '目光落向';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;