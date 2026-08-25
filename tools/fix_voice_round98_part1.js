const fs = require('fs');
const path = require('path');

const LL1 = '韩冰开口，声音轻得像要被风吹散。';
const LL2 = '韩冰开口，音量低到已经听不真切。';
const LL3 = '韩冰开口，声音轻得仿佛随时会断掉。';
const LL4 = '韩冰开口，音量低得近乎无声。';
const LL5 = '韩冰开口，把声音压到极低。';
const LL6 = '韩冰开口，音量低得难以听见。';
const LL7 = '叶文轩的声音平直如线。';
const LL8 = '声音。声音很熟。像他以前听过的声音。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
