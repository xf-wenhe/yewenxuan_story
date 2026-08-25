const fs = require('fs');
const path = require('path');

// === R76 SOURCES (8 patterns) ===

const OO1 = '声音来回转动，终于歇了。';
const OO2 = '声音一圈圈打转，终于平息。';
const OO3 = '声音挥之不去。';
const OO4 = '声音转了转，然后消失了。';
const OO5 = '声音转了转，最终消散。';
const OO6 = '声音一圈圈打转，最终消散。';
const OO7 = '声音里面有紧迫感。';
const OO8 = '他还需要更多时间。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;