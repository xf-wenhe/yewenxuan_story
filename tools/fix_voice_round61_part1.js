const fs = require('fs');
const path = require('path');

// === R61 SOURCES (8 patterns) ===

const YY1 = '声音变了调，像是远处有什么在低语。';
const YY2 = '声音极弱。';
const YY3 = '声音极轻而短。';
const YY4 = '声音很细小发颤。';
const YY5 = '声音提高了。';
const YY6 = '声音简短。';
const YY7 = '声音轻得发抖。';
const YY8 = '声音极轻小。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;