const fs = require('fs');
const path = require('path');

const NN1 = '声音有些';
const NN2 = '声音很轻';
const NN3 = '声音平淡';
const NN4 = '嗓音低到极致';
const NN5 = '嗓音沙哑';
const NN6 = '嗓音暗哑';
const NN7 = '嗓音嘶哑';
const NN8 = '声音发抖';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;