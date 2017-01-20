var _ = require('underscore')
var compressor = require('node-minify')
var fs = require('fs')
var path = require('path')
var url = require('url')

var StorageFactory = require(path.join(__dirname, '/storage/factory'))
var Cache = require(path.join(__dirname, '/../cache'))

/**
 * Performs checks on the supplied URL and fetches the asset
 * @param {String} format - the type of asset requested
 * @param {Object} req - the original HTTP request
 */
var AssetHandler = function (format, req) {
  this.supportedExtensions = ['ttf', 'otf', 'woff', 'svg', 'eot']
  this.format = format
  this.compress = '0'
  this.storageFactory = Object.create(StorageFactory)
  this.storageHandler = null
  this.cache = Cache()

  this.req = req

  var parsedUrl = url.parse(this.req.url, true)

  // '/js/1/test.js' -> [ 'js', '1', 'test.js' ]
  // '/fonts/test.ttf' -> [ fonts', 'test.ttf' ]
  this.urlParts = _.compact(parsedUrl.pathname.split('/'))

  this.fullUrl = this.req.url
  this.hasQuery = !_.isEmpty(parsedUrl.search)

  if (this.format === 'css' || this.format === 'js') {
    this.url = this.urlParts.length > 2 ? this.urlParts.slice(2).join('/') : this.urlParts.join('/')
    this.fileExt = this.format
    this.fileName = this.hasQuery ? this.urlParts[1] : this.urlParts[2]
    this.compress = this.hasQuery ? parsedUrl.query.compress : this.urlParts[1]
  } else if (this.format === 'fonts') {
    this.url = this.urlParts.splice(1).join('/')
    this.fullUrl = this.url
    this.fileName = path.basename(this.url)
    this.fileExt = path.extname(this.fileName).replace('.', '')
  }

  this.cacheKey = this.req.url
}

AssetHandler.prototype.get = function () {
  var self = this
  self.cached = false

  return new Promise(function (resolve, reject) {
    var message

    if (self.compress !== '0' && self.compress !== '1') {
      message = 'The path format is invalid. Use http://www.example.com/{format-(js, css)}/{compress-(0, 1)}/{filepath}'
    }

    if (self.format === 'fonts' && self.supportedExtensions.indexOf(self.fileExt.toLowerCase()) < 0) {
      message = 'Font file type should be TTF, OTF, WOFF, SVG or EOT'
    }

    if (message) {
      var err = {
        statusCode: 400,
        message: message
      }

      return reject(err)
    }

    // get from cache
    self.cache.getStream(self.cacheKey, function (stream) {
      if (stream) {
        self.cached = true
        return resolve(stream)
      }

      self.storageHandler = self.storageFactory.create('asset', self.fullUrl, self.hasQuery)

      self.storageHandler.get().then(function (stream) {
        // compress, returns stream
        self.compressFile(stream).then(function (stream) {
          // cache, returns stream
          self.cache.cacheFile(stream, self.cacheKey, function (stream) {
            return resolve(stream)
          })
        })
      }).catch(function (err) {
        return reject(err)
      })
    })
  })
}

AssetHandler.prototype.compressFile = function (stream) {
  var self = this

  return new Promise(function (resolve, reject) {
    // no compression required, send stream back
    if (self.format === 'fonts' || self.compress === '0') return resolve(stream)

    if (!fs.existsSync(path.resolve('./tmp'))) fs.mkdirSync(path.resolve('./tmp'))

    var compression = self.format === 'js' ? 'uglifyjs' : 'sqwish'

    var fileIn = path.join(path.resolve('./tmp'), self.fileName)
    var newFileName = self.fileName.split('.')[0] + '.min.' + self.fileExt
    var fileOut = path.join(path.resolve('./tmp'), newFileName)

    stream.pipe(fs.createWriteStream(fileIn)).on('finish', function () {
      compressor.minify({
        compressor: compression,
        input: fileIn,
        output: fileOut,
        callback: function (err, min) {
          if (err) {
            return reject(err)
          } else {
            fs.unlinkSync(fileIn)
            stream = fs.createReadStream(fileOut)

            stream.on('open', function () {
              return resolve(stream)
            })

            stream.on('close', function () {
              fs.unlink(fileOut)
            })
          }
        }
      })
    })
  })
}

AssetHandler.prototype.contentType = function () {
  if (this.format === 'js') {
    return 'application/javascript'
  } else if (this.format === 'css') {
    return 'text/css'
  }

  if (this.fileExt === 'eot') {
    return 'application/vnd.ms-fontobject'
  } else if (this.fileExt === 'otf') {
    return 'application/font-sfnt'
  } else if (this.fileExt === 'svg') {
    return 'image/svg+xml'
  } else if (this.fileExt === 'ttf') {
    return 'application/font-sfnt'
  } else if (this.fileExt === 'woff') {
    return 'application/font-woff'
  }
}

AssetHandler.prototype.getFilename = function () {
  return this.fileName
}

AssetHandler.prototype.getLastModified = function () {
  if (!this.storageHandler || !this.storageHandler.getLastModified) return null

  return this.storageHandler.getLastModified()
}

module.exports = function (format, req) {
  return new AssetHandler(format, req)
}

module.exports.AssetHandler = AssetHandler
