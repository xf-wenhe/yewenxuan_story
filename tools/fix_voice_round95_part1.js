const fs = require('fs');
const path = require('path');

// === R95 SOURCES (8 patterns) ===

const II1 = '声音没有轻重也没有起伏。';
const II2 = '声音，在变调，地面在震动天花板上的灰尘，在落。';
const II3 = '声音越来越远。';
const II4 = '声音0429备份在传递赵大嘴的话。';
const II5 = '声音没有感情。声音很冷。声音像系统的声音。';
const II6 = '声音在0429备份的信号中传来，0429备份在传递。';
const II7 = '声音在球形空间中回响。';
const II8 = '声音有些恍惚。';

const VOLUMES = ['volume-1','volume-2','volume-3','volume-4','volume-5','volume-6','volume-7'];
const TARGET = 3020;
