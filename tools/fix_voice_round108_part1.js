const fs = require('fs');
const path = require('path');

const WW1 = '嗓音低了下去。';
const WW2 = '嗓音粗哑。';
const WW3 = '声线平直而缺乏变化。';
const WW4 = '嗓音沉了下来。';
const WW5 = '嗓音带着砂砾般的摩擦感。';
const WW6 = '嗓音里透出。';
const WW7 = '嗓音已经哑到不能再哑。';
const WW8 = '嗓音透着粗糙。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;