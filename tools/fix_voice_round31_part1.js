const fs = require('fs');
const path = require('path');

// === R31 SOURCES (8 patterns: 4 air + 2 thought + 2 character) ===

const U1 = '周围的空气静了一瞬';
const U2 = '周围的空气也因为这句话静了一瞬';
const U3 = '周围的空气因为这句话忽然静了';
const U4 = '周围的空气因为这句话凝滞了一瞬';
const U5 = '那个念头在他脑子里转了转，才终于止住';
const U6 = '那个念头在他脑子里转了一圈又一圈，才慢慢歇了';
const U7 = '赵大嘴的父亲的声音很哑';
const U8 = '叶文轩的声音有些发紧';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;