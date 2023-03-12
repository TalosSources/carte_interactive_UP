'use strict';

// from https://www.npmjs.com/package/geocoordinate

const D2R = Math.PI / 180.0;
/** earth radius in m */
const R = 6376500;
const mPerDegree = (2 * Math.PI * R) / 360;
const minDegreeDeviation = 6;

export class GeoCoordinate {
  private _latitude: number;
  private _longitude: number;
  private _altitude: number | null;
  constructor(coordinate :
              { latitude:number,
                longitude:number,
                altitude?: number}
              ) {
      if (!Number.isFinite(coordinate.latitude)) {
        throw new TypeError('Invalid latitude passed to GeoCoordinate constructor');
      }
      if (!Number.isFinite(coordinate.longitude)) {
        throw new TypeError('Invalid longitude passed to GeoCoordinate constructor');
      }
      // TODO We may want to check for null here
      if (Number.isFinite(coordinate.altitude)) {
        throw new TypeError('Invalid altitude passed to GeoCoordinate constructor');
      }
      if (coordinate.altitude == undefined) {
        this._altitude = null;
      } else {
        this._altitude = coordinate.altitude;
      }
      this._longitude = coordinate.longitude;
      this._latitude = coordinate.latitude;
  }

  getLongitude() {
    return this._longitude;
  }

  getLatitude() {
    return this._latitude;
  }

  /**
   * Calculates a distance between two points, assuming they are on a plain area, correcting by actual latitude distortion.
   * Will produce bad results for long distances (>>500km) and points very close to the poles.
   */
  quickDistanceTo(other: GeoCoordinate) {
    const dLon = Math.abs(other._longitude - this._longitude);
    const dLat = Math.abs(other._latitude - this._latitude);
    const avgLat = (other._latitude + this._latitude) / 2;
    const x = dLon * Math.cos(avgLat * D2R);
    return Math.sqrt(x * x + dLat * dLat) * mPerDegree;
  };

  preciseDistanceTo(other: GeoCoordinate) {
    const longitudeDelta =
      Math.abs(other._longitude - this._longitude) * D2R;
    const latitudeDelta = Math.abs(other._latitude - this._latitude) * D2R;
    const a =
      Math.pow(Math.sin(latitudeDelta / 2), 2) +
      Math.cos(this._latitude * D2R) *
        Math.cos(other._latitude * D2R) *
        Math.pow(Math.sin(longitudeDelta / 2), 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Returns the distance in meters between this coordinate and the given one.
   * @param {GeoCoordinate} other
   * @param {boolean} [precise=false] If set to true it will always calculate precise distance
   */
  distanceTo(other: GeoCoordinate, precise : boolean = true) {
    const longitudeDelta = Math.abs(other._longitude - this._longitude);
    const latitudeDelta = Math.abs(other._latitude - this._latitude);
    // check if points are close enough to ingnore error from fast calculation
    if (
      precise ||
      latitudeDelta > minDegreeDeviation ||
      longitudeDelta > minDegreeDeviation
    ) {
      return this.preciseDistanceTo(other);
    } else {
      return this.quickDistanceTo(other);
    }
  };

  /**
   * This method modifies array in-place
   * @param {GeoCoordinate[]} arr
   * @returns {GeoCoordinate[]} Sorted arr
   */
  sortArrayByReferencePoint(arr: GeoCoordinate[]): GeoCoordinate[] {
    const that = this;
    arr.sort(function(a, b) {
      return that.quickDistanceTo(a) - that.quickDistanceTo(b);
    });
    return arr;
  };

  /**
   * Calculates a distance between two points, assuming they are on a plain area, correcting by actual latitude distortion.
   * Will produce bad results for long distances (>>500km) and points very close to the poles.
   * @param {GeoCoordinate} other
   * @returns {number}
   */
  distance3DTo(other: GeoCoordinate): number {
    if (other._altitude == null || this._altitude == null) {
      throw new TypeError('Altitude must not be null for distance3DTo')
    }
    const dLon = Math.abs(other._longitude - this._longitude) * mPerDegree;
    const dLat = Math.abs(other._latitude - this._latitude) * mPerDegree;
    const dAlt = Math.abs(other._altitude - this._altitude);
    const avgLat = (other._latitude + this._latitude) / 2;
    const x = dLon * Math.cos(avgLat * D2R);
    return Math.sqrt(x * x + dLat * dLat + dAlt * dAlt);
  };

  /** Calculates the coordinate that is a given number of meters from this coordinate at the given angle
   *  @param {number} distance the distance in meters the new coordinate is way from this coordinate.
   *  @param {number} bearing the angle at which the new point will be from the old point. In radians, clockwise from north.
   *  @returns {GeoCoordinate} a new instance of this class with only the latitude and longitude set. */
  pointAtDistance(distance: number, bearing: number): GeoCoordinate {
    const latitudeRadians = this._latitude * D2R;
    const longitudeRadians = this._longitude * D2R;
    const lat2 = Math.asin(
      Math.sin(latitudeRadians) * Math.cos(distance / R) +
        Math.cos(latitudeRadians) * Math.sin(distance / R) * Math.cos(bearing)
    );
    const lon2 =
      longitudeRadians +
      Math.atan2(
        Math.sin(bearing) * Math.sin(distance / R) * Math.cos(latitudeRadians),
        Math.cos(distance / R) - Math.sin(latitudeRadians) * Math.sin(lat2)
      );
    return new GeoCoordinate({latitude: lat2/D2R, longitude:  lon2 / D2R});
  };

  /**
   * calculates the bearing from this point to a given Geocoordinate
   * @param {GeoCoordinate} other
   * @return {number} bearing from 0 to 2Pi in radiant
   */
  bearingRadTo(other: GeoCoordinate): number {
    const dLong = (other._longitude - this._longitude) * D2R;
    const lat1 = this._latitude * D2R;
    const lat2 = other._latitude * D2R;
    const y = Math.sin(dLong) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLong);
    const bearing = Math.atan2(y, x);
    return bearing < 0 ? 2 * Math.PI + bearing : bearing;
  };

  /**
   * calculates the bearing from this point to a given Geocoordinate
   * @param {GeoCoordinate} other
   * @return {number} bearing from 0° to 359,99999°
   */
  bearingTo(other: GeoCoordinate): number {
    return this.bearingRadTo(other) / D2R;
  };

}
