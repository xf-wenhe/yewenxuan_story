const fs = require('fs');
const path = require('path');

// === R29 SOURCES (10 patterns, recycled R27/R28 alternatives) ===

const R1 = '叶文轩的心脏怦怦直跳';
const R2 = '叶文轩的心脏在剧烈跳动';
const R3 = '叶文轩的心脏在咚咚作响';
const R4 = '叶文轩的心脏跳得很厉害';
const R5 = '那些影子在光里晃动，是一些被遗忘的记忆在挣扎';
const R6 = '这个念头在他脑子里转了几圈，才慢慢止住';
const R7 = '这个念头在他脑子里转了转，终于停了下来';
const R8 = '这个念头在他脑子里转了几个来回，才慢慢停';
const R9 = '这个念头在他脑子里转了一圈又一圈，才终于歇了';
const R10 = '墙上的灯光忽明忽暗';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;