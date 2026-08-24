const fs = require('fs');
const path = require('path');

// === R26 SOURCES (R25-era chapter-end boilerplate, 22 patterns) ===
// Group H: silence/darkness (10 sources, ~22 each = ~220)
const H1 = '四周安静下来，连呼吸声都听得清清楚楚';
const H2 = '四下里静得能听见自己的心跳';
const H3 = '空气里静得只剩下自己的呼吸声';
const H4 = '周围安静下来，他能听见自己的呼吸';
const H5 = '只有他一个人站在那儿，什么也没说';
const H6 = '四周没有其他人，只剩他自己';
const H7 = '站在那里像一座孤岛，没人说话';
const H8 = '墙上挂着几盏未亮的灯，灰暗灰暗';
const H9 = '沉默把这句话吞了进去，无声无息';
const H10 = '外面下着小雨，没有人说话';

// Group F: air/silence reacting to words (12 sources, ~21-22 each = ~352)
const F1 = '周围的空气跟着这句话静了下来';
const F2 = '周围的空气跟着这句话安静了下来';
const F3 = '周围的空气跟着这句话也静了下来';
const F4 = '周围的空气跟着这句话忽然静了下来';
const F5 = '空气像被这句话压住了一瞬';
const F6 = '空气像被这句话冻住了一瞬';
const F7 = '空气跟着这句话也安静了下来';
const F8 = '空气跟着这句话也静了下来';
const F9 = '空气跟着这句话静了下来，又慢慢散去';
const F10 = '空气跟着这句话静了下来，又慢慢平息';
const F11 = '空气跟着这句话静了下来，又渐渐散去';
const F12 = '空气跟着这句话沉了下来，又慢慢散去';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;