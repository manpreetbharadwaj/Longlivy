/**
 * Google's encoded polyline format (precision 5, ~1 m), the `encoding:
 * "polyline"` form /activities accepts for `route.points`. Pure functions so
 * they can be unit-tested outside the app.
 */
function encodeSigned(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  return out + String.fromCharCode(v + 63);
}

export function encodePolyline(points: readonly { latitude: number; longitude: number }[]): string {
  let lastLat = 0;
  let lastLng = 0;
  let out = '';
  for (const { latitude, longitude } of points) {
    const lat = Math.round(latitude * 1e5);
    const lng = Math.round(longitude * 1e5);
    out += encodeSigned(lat - lastLat) + encodeSigned(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return out;
}

export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const next = (): number => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += next();
    lng += next();
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}
