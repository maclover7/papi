const tap = require('tap');
const nock = require('nock');
const supertest = require('supertest');

const ignoreQueryParams = (pathAndQuery) => {
  return require('url').parse(pathAndQuery, true).pathname;
};

const getPittbus = (cb) => {
  process.env.PITTBUS_ID = '738';
  process.env.PITTBUS_KEY = '';

  const successFixture = require('fs').readFileSync('./test/pittbus_routes_success.json').toString();
  nock('http://www.pittshuttle.com')
    .filteringPath(ignoreQueryParams)
    .get('/Services/JSONPRelay.svc/GetRoutes')
    .reply(200, successFixture);

  supertest(require('../lib/server'))
    .get('/api/pittbus')
    .end(cb);
};

tap.test('correctly sends pittbus response if success', (t) => {
  const successFixture = require('fs').readFileSync('./test/pittbus_success.json').toString();
  nock('http://www.pittshuttle.com')
    .filteringPath(ignoreQueryParams)
    .get('/Services/JSONPRelay.svc/GetRouteStopArrivals')
    .reply(200, successFixture);

  getPittbus((err, res) => {
    t.equal(200, res.statusCode);

    const expectedResponse = [
      {
        route: '1U North South Loop',
        status: 'In 305 seconds'
      }
    ];

    t.strictSame(expectedResponse, res.body);
    t.end();
  });
});

tap.test('correctly sends pittbus response if error', (t) => {
  nock('http://www.pittshuttle.com')
    .filteringPath(ignoreQueryParams)
    .get('/Services/JSONPRelay.svc/GetRouteStopArrivals')
    .reply(500, '');

  getPittbus((err, res) => {
    t.equal(500, res.statusCode);
    t.strictSame([], res.body);
    t.end();
  });
});
