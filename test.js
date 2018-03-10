const test = require('tape');
const filter = require('./readme');

test('it filters a pullable source', t => {
  t.plan(26);
  const upwardsExpected = [
    [0, 'function'],
    [1, 'undefined'],
    [1, 'undefined'],
    [1, 'undefined'],
    [1, 'undefined'],
  ];
  const downwardsExpectedType = [
    [0, 'function'],
    [1, 'number'],
    [1, 'number'],
    [2, 'undefined'],
  ];
  const downwardsExpected = [1, 3];

  function makeSource() {
    let _sink;
    let sent = 0;
    const source = (type, data) => {
      t.true(upwardsExpected.length > 0, 'source can be pulled');
      const e = upwardsExpected.shift();
      t.equals(type, e[0], 'upwards type is expected: ' + e[0]);
      t.equals(typeof data, e[1], 'upwards data is expected: ' + e[1]);

      if (type === 0) {
        _sink = data;
        _sink(0, source);
        return;
      }
      if (sent === 3) {
        _sink(2);
        return;
      }
      if (sent === 0) {
        sent++;
        _sink(1, 1);
        return;
      }
      if (sent === 1) {
        sent++;
        _sink(1, 2);
        return;
      }
      if (sent === 2) {
        sent++;
        _sink(1, 3);
        return;
      }
    };
    return source;
  }

  function makeSink() {
    let talkback;
    return (type, data) => {
      const et = downwardsExpectedType.shift();
      t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
      t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
      if (type === 0) {
        talkback = data;
        return talkback(1);
      }
      if (type === 1) {
        const e = downwardsExpected.shift();
        t.equals(data, e, 'downwards data is expected: ' + e);
        return talkback(1);
      }
    };
  }

  const source = makeSource();
  const filtered = filter(async x => await (x % 2 === 1))(source);
  const sink = makeSink();
  filtered(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 300);
});

test('it filters an async finite listenable source', t => {
  t.plan(15);
  const upwardsExpected = [[0, 'function'], [1, 'undefined']];
  const downwardsExpectedType = [
    [0, 'function'],
    [1, 'number'],
    [1, 'number'],
    [2, 'undefined'],
  ];
  const downwardsExpected = [1, 3];

  function makeSource() {
    let sent = 0;
    const source = (type, data) => {
      const e = upwardsExpected.shift();
      t.equals(type, e[0], 'upwards type is expected: ' + e[0]);
      t.equals(typeof data, e[1], 'upwards data is expected: ' + e[1]);
      if (type === 0) {
        const sink = data;
        const id = setInterval(() => {
          if (sent === 0) {
            sent++;
            sink(1, 1);
            return;
          }
          if (sent === 1) {
            sent++;
            sink(1, 2);
            return;
          }
          if (sent === 2) {
            sent++;
            sink(1, 3);
            return;
          }
          if (sent === 3) {
            sink(2);
            clearInterval(id);
            return;
          }
        }, 100);
        sink(0, source);
      }
    };
    return source;
  }

  function sink(type, data) {
    const et = downwardsExpectedType.shift();
    t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
    t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
    if (type === 1) {
      const e = downwardsExpected.shift();
      t.equals(data, e, 'downwards data is expected: ' + e);
    }
  }

  const source = makeSource();
  const filtered = filter(x => new Promise((resolve, reject) => resolve(x % 2 === 1)))(source);
  filtered(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 700);
});

test('it returns a source that disposes upon upwards END', t => {
  t.plan(15);
  const upwardsExpected = [
    [0, 'function'],
    [1, 'undefined'],
    [2, 'undefined']
  ];
  const downwardsExpectedType = [
    [0, 'function'],
    [1, 'number'],
    [1, 'number'],
    [1, 'number'],
  ];
  const downwardsExpected = [1, 3];

  function makeSource() {
    let sent = 0;
    let id;
    const source = (type, data) => {
      const e = upwardsExpected.shift();
      t.equals(type, e[0], 'upwards type is expected: ' + e[0]);
      t.equals(typeof data, e[1], 'upwards data is expected: ' + e[1]);
      if (type === 0) {
        const sink = data;
        id = setInterval(() => {
          sink(1, ++sent);
        }, 100);
        sink(0, source);
      } else if (type === 2) {
        clearInterval(id);
      }
    };
    return source;
  }

  function makeSink(type, data) {
    let talkback;
    return (type, data) => {
      const et = downwardsExpectedType.shift();
      t.equals(type, et[0], 'downwards type is expected: ' + et[0]);
      t.equals(typeof data, et[1], 'downwards data type is expected: ' + et[1]);
      if (type === 0) {
        talkback = data;
      }
      if (type === 1) {
        const e = downwardsExpected.shift();
        t.equals(data, e, 'downwards data is expected: ' + e);
      }
      if (downwardsExpected.length === 0) {
        talkback(2);
      }
    };
  }

  const source = makeSource();
  const filtered = filter(async x => {return await x % 2 === 1})(source);
  const sink = makeSink();
  filtered(0, sink);

  setTimeout(() => {
    t.pass('nothing else happens');
    t.end();
  }, 700);
});
