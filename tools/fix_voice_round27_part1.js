const fs = require('fs');
const path = require('path');

// === R27 SOURCES (R26-era concentrated patterns, 8 patterns) ===
// Group A: 念头...转了一圈，才停下来 (378 + 286 = 664)
const A1 = '这个念头在他脑子里转了一圈，才停下来';
const A2 = '那个念头在他脑子里转了一圈，才停下来';

// Group B: 空气...这句话...一瞬 (282 + 163 = 445)
const B1 = '周围的空气因为这句话安静了一瞬';
const B2 = '空气因为这句话凝固了一瞬';

// Group C: 这句话沉进了他心里最深处 (246)
const C1 = '这句话沉进了他心里最深处';

// Group D: 念头...缠住了他的思绪 (155)
const D1 = '那个念头一旦出现，便缠住了他的思绪';

// Group E: 站在那里...不知道该往哪走 (304)
const E1 = '他站在那里，一时不知道该往哪走';

// Group F: 那些影子在光里晃动 (185)
const F1 = '那些影子在光里晃动，是被遗忘的记忆在挣扎';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;