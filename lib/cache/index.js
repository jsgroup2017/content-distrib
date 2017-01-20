var PassThrough = require('stream').PassThrough
var path = require('path')
var sha1 = require('sha1')

var config = require(path.join(__dirname, '/../../config'))

/**
 * Creates a new Cache instance for the server
 * @constructor
 */
var Cache = function () {
  this.enabled = config.get('caching.directory.enabled') || config.get('caching.redis.enabled')
}

var instance
module.exports = function () {
  if (!instance) {
    instance = new Cache()
  }
  return instance
}

// reset method for unit tests
module.exports.reset = function () {
  instance = null
}

/**
 *
 */
Cache.prototype.cacheFile = function (stream, key, cb) {
  if (!this.enabled) return cb(stream)

  var cacheStream = PassThrough()
  var responseStream = PassThrough()
  stream.pipe(cacheStream)
  stream.pipe(responseStream)

  var encryptedKey = sha1(key)
}

/**
 *
 */
Cache.prototype.get = function (key) {
  if (!this.enabled) return Promise.resolve(null)

}

/**
 *
 */
Cache.prototype.set = function (key, value) {
  if (!this.enabled) return Promise.resolve(null)

}

/**
 *
 */
Cache.prototype.getStream = function (key, cb) {
  if (!this.enabled) return cb(null)

  var encryptedKey = sha1(key)
}

/**
 *
 */
module.exports.delete = function (pattern, callback) {

}
