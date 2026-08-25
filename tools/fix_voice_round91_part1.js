const fs = require('fs');
const path = require('path');

// === R91 SOURCES (8 patterns) ===

const EE1 = '声音一圈圈荡开，最后静下来。';
const EE2 = '声音久久萦绕。';
const EE3 = '声音转了几回，到底散掉。';
const EE4 = '声音细得像一缕丝。';
const EE5 = '声音转了几下，最后归于寂静。';
const EE6 = '声音平直稳。';
const EE7 = '声音一圈圈荡开，最后淡去。';
const EE8 = '声音平直而均匀。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
