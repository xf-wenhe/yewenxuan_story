const fs = require('fs');
const path = require('path');

const UU1 = '声线平静，没有一处颤动，';
const UU2 = '声线平稳得没有起伏，';
const UU3 = '嗓音平稳得不带一丝波动，';
const UU4 = '嗓音郑重，每一个字都咬得实，';
const UU5 = '嗓音沙哑。';
const UU6 = '嗓音低沉。';
const UU7 = '声调陡然低了下去。';
const UU8 = '声调平直。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;