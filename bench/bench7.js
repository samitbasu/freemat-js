'use strict';
const chai = require('chai');
const assert = chai.assert;
const dbl = require('../double.js');
const tst = require('../test_help.js');

let A = dbl.make_array([512,512,10]);
console.log(tst.time_it( () => {
    for (let z=1;z<=10;z++) {
        for (let i=1;i<=512;i++) {
            for (let j=1;j<=512;j++) {
                A.as_array().set([j,i,z],dbl.make_scalar(i-j,0));
            }
        }
    }
} ));

