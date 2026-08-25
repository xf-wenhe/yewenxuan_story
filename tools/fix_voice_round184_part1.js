const fs = require('fs');
const path = require('path');

const NN1 = '声调平稳';
const NN2 = '声色的底色';
const NN3 = '嗓音发颤';
const NN4 = '声色的质地';
const NN5 = '语调平白';
const NN6 = '声音发颤';
const NN7 = '声音颤动';
const NN8 = '声音淡得';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;