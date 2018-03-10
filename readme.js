/**
 * callbag-filter-promise
 * ----------------------
 *
 * A version of callbag-filter that works with async/await/Promisified predicates.
 *
 * `npm install callbag-filter-promise`
 *
 * Example:
 *
 *     const fromIter = require('callbag-from-iter');
 *     const iterate = require('callbag-iterate');
 *     const filterPromise = require('callbag-filter-promise');
 *
 *     const source = filterPromise(async x => await x % 2)(fromIter([1,2,3,4,5]));
 *
 *     iterate(x => console.log(x))(source); // 1
 *                                           // 3
 *                                           // 5
 * 
 * Note if you tried the above with just `filter`, 2 and 4 would be passed, since
 * the condition returns a Promise object, which is truthy.
 */

const filterPromise = condition => source => (start, sink) => {
  if (start !== 0) return;
  let talkback;
  source(0, async (t, d) => {
    if (t === 0) {
      talkback = d;
      sink(t, d);
    } else if (t === 1) {
      if (await condition(d)) sink(t, d);
      else talkback(1);
    }
    else sink(t, d);
  });
};

module.exports = filterPromise;
