const fs = require('fs');
const path = require('path');

const JJ1 = '声音几度来回，到底安静下来。';
const JJ2 = '赵大嘴把声音压得比平时更低。';
const JJ3 = '声音，"0415年4月15日。';
const JJ4 = '声音"在叶文轩的脑子里"安静"了两秒。';
const JJ5 = '声音，"0415-1锚点的时间记忆被加密了。';
const JJ6 = '他还需要一会儿才能表达清楚。';
const JJ7 = '声音在赵磊脑子里响，很轻，很稳。';
const JJ8 = '声音，压得很低，"玩。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
