const fs = require('fs');
const path = require('path');

// === R70 SOURCES (8 patterns) ===

const HH1 = '声音抖个不停。';
const HH2 = '声音平静得像一潭水。';
const HH3 = '声音平稳得像流水没有变化。';
const HH4 = '声音简短、清晰。';
const HH5 = '声音从后面传来。';
const HH6 = '声音低到了极点。';
const HH7 = '声音平淡而没有任何波澜。';
const HH8 = '声音平静得像没有情绪。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;