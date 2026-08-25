const fs = require('fs');
const path = require('path');

const HH1 = '"赵大嘴的声音，"是';
const HH2 = '那个声音是';
const HH3 = '"赵大嘴的声音，"不是';
const HH4 = '，赵大嘴的声音很平，是';
const HH5 = '文轩开口，声音里满是';
const HH6 = '他的声音，在形成，是';
const HH7 = '轩用极低的声音说';
const HH8 = '。"韩冰的声音从身后传';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;