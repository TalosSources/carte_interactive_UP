'use strict';
// from https://www.npmjs.com/package/geocoordinate
import {GeoCoordinate} from './Coordinate';

type Axis = { range: number; min: number; max: number; }

/** returns the signed smallest distance between a and b assuming their
 domain is circular (repeating) each -range/2 and range/2 */
function smallestCircularDistance(range:number, a:number, b:number) {
  //categoryA and categoryB are integer in the range of -0.5 to 0.5
  const halfRange = range / 2;
  const categoryA = Math.round(a / halfRange) / 2;
  const categoryB = Math.round(b / halfRange) / 2;
  const normalizeAmount = Math.floor(categoryA - categoryB);
  //add -1, 0 or 1 times the range to normalize
  b += normalizeAmount * range;
  //return signed distance
  return b - a;
}

export class GeoBoundingBox {
  private _axes: Axis[];
  private _latitude: Axis;
  private _longitude: Axis;
  constructor() {
    this._longitude = {
      range: 360,
      min: NaN,
      max: NaN
    };
    this._latitude = {
      range: 180,
      min: NaN,
      max: NaN
    };
    this._axes = [this._latitude, this._longitude];
    //this._settled = false;
  }

  /**
   * fromCoordinates
   * @description create a Bounding Box from Coordinates
   * @param {array} coordinates an array of coordinates
   * @example
   * const box = GeoBoundingBox.fromCoordinates([[1,1], 2,2]]);
   * @returns {Object} GeoBoundingBox instance
   */
  static fromCoordinates(coordinates: GeoCoordinate[]) : GeoBoundingBox {
    if (coordinates.length < 2) {
      throw new RangeError('Not enough arguments passed to fromCoordinates');
    }
    const instance = new GeoBoundingBox();
    for (let i = 0; i < coordinates.length; i++) {
      instance.pushCoordinate(coordinates[i]);
    }
    return instance;
  };

  pushCoordinate(coord : GeoCoordinate) {
    function updateAxis(value : number, axis:{ range: number; min: number; max: number;}) {
      if (isNaN(axis.min) || isNaN(axis.max)) {
        axis.min = value;
        axis.max = value;
        return;
      }

      const distanceFromMin = smallestCircularDistance(
        axis.range,
        axis.min,
        value
      );
      const distanceFromMax = smallestCircularDistance(
        axis.range,
        axis.max,
        value
      );

      //distance 0 means it lies on one of the boundaries of the box, which we consider to be inside
      if (distanceFromMin === 0 || distanceFromMax === 0) {
        return;
      }
      //lies within min and max since distances from min and max
      //have a different sign (different direction from the points)
      if (distanceFromMin / distanceFromMax < 0) {
        return;
      }
      if (axis.min < 0 && value < 0) {
        //value is smaller then min, so decrease min
        if (distanceFromMin > 0) {
          axis.min = value;
        }
        //value is bigger then max, so increase max
        if (distanceFromMax < 0) {
          axis.max = value;
        }
      } else {
        //value is smaller then min, so decrease min
        if (distanceFromMin < 0) {
          axis.min = value;
        }
        //value is bigger then max, so increase max
        if (distanceFromMax > 0) {
          axis.max = value;
        }
      }

    }

    updateAxis(coord.getLatitude(), this._latitude);
    updateAxis(coord.getLongitude(), this._longitude);
  };

  containCircle(centrePoint:GeoCoordinate, radius:number) {
    this.pushCoordinate(centrePoint.pointAtDistance(radius, 0));
    this.pushCoordinate(centrePoint.pointAtDistance(radius, 90));
    this.pushCoordinate(centrePoint.pointAtDistance(radius, 180));
    this.pushCoordinate(centrePoint.pointAtDistance(radius, 270));
  };

  contains(coord: GeoCoordinate) {
    function outOfBounds(value: number, axis:Axis) {
      if (isNaN(axis.min) || isNaN(axis.max)) {
        return true;
      }

      const distanceFromMin = smallestCircularDistance(
        axis.range,
        axis.min,
        value
      );
      const distanceFromMax = smallestCircularDistance(
        axis.range,
        axis.max,
        value
      );

      //distance 0 means it lies on one of the boundaries of the box, which we consider to be inside
      if (distanceFromMin === 0 || distanceFromMax === 0) {
        return false;
      }
      // all values are negative
      if (
        axis.min < 0 &&
        axis.max < 0 &&
        value < 0 &&
        Math.round(distanceFromMin / distanceFromMax) === 0
      ) {
        return true;
      }
      //lies not within min and max since distances from min and max
      //have the same sign (same direction from the points)
      return distanceFromMin / distanceFromMax >= 0;
    }
    return !(outOfBounds(coord.getLatitude(), this._latitude) ||
             outOfBounds(coord.getLongitude(), this._longitude))
  };

  getTopLeft() {
    return new GeoCoordinate({latitude: this._latitude.max, longitude: this._longitude.min});
  }

  getBottomRight() {
    return new GeoCoordinate({latitude: this._latitude.min, longitude: this._longitude.max});
  }

  centerLatitude() {
    return (this._latitude.min + this._latitude.max) / 2;
  };

  centerLongitude() {
    return (this._longitude.min + this._longitude.max) / 2;
  };

  center() {
    return new GeoCoordinate({
      latitude: this.centerLatitude(),
      longitude: this.centerLongitude()
    });
  };

  /**
   * mergeBox
   * @description merges a bounding box with another one
   * @param {Object} box an object
   * @param {number} box.topLeftLatitude - topLeft latitude
   * @param {number} box.topLeftLongitude - topLeft longitude
   * @param {number} box.bottomRightLatitude - bottomRight latitude
   * @param {number} box.bottomRightLongitude - bottomRight latitude
   * @example
   * const box = GeoBoundingBox.fromCoordinates([[1,1], 2,2]]);
   * box.mergeBox({
   *   topLeftLatitude: 3,
   *   topLeftLongitude: 0,
   *   bottomRightLatitude: 0,
   *   bottomRightLongitude: -1,
   * })
   */
  mergeBBox(other:GeoBoundingBox) {
    this.pushCoordinate(other.getTopLeft());
    this.pushCoordinate(other.getBottomRight());
  };

}
