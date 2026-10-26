import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodePolyline, encodePolyline } from '../src/utils/geo/polyline';

test('matches the published Google example', () => {
  // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
  const points = [
    { latitude: 38.5, longitude: -120.2 },
    { latitude: 40.7, longitude: -120.95 },
    { latitude: 43.252, longitude: -126.453 },
  ];
  assert.equal(encodePolyline(points), '_p~iF~ps|U_ulLnnqC_mqNvxq`@');
});

test('round-trips a route to ~1 m precision', () => {
  const route = [
    { latitude: 28.613939, longitude: 77.209021 },
    { latitude: 28.614512, longitude: 77.210004 },
    { latitude: 28.61399, longitude: 77.20899 },
    { latitude: -33.8688, longitude: 151.2093 },
  ];
  const decoded = decodePolyline(encodePolyline(route));
  assert.equal(decoded.length, route.length);
  decoded.forEach((p, i) => {
    assert.ok(Math.abs(p.latitude - route[i].latitude) < 1e-5);
    assert.ok(Math.abs(p.longitude - route[i].longitude) < 1e-5);
  });
});

test('empty route encodes to an empty string', () => {
  assert.equal(encodePolyline([]), '');
  assert.deepEqual(decodePolyline(''), []);
});
