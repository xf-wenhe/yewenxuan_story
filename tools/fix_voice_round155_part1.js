const fs = require('fs');
const path = require('path');

const NN1 = '声调之外';
const NN2 = '视线定住';
const NN3 = '视线移开';
const NN4 = '目光停住';
const NN5 = '声调之内';
const NN6 = '嗓音沙哑';
const NN7 = '目光投向';
const NN8 = '视线离开';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;