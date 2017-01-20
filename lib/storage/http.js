var fs = require('fs')
var mkdirp = require('mkdirp')
var path = require('path')
var sha1 = require('sha1')
var urljoin = require('url-join')
var wget = require('wget-improved')

var tmpDirectory = path.resolve(path.join(__dirname, '/../../workspace/_tmp'))
console.log(tmpDirectory)
mkdirp(tmpDirectory, (err, made) => {
  console.log(made)
  if (err) {
    console.log(err)
  }
})

var HTTPStorage = function (settings, url) {
  if (settings && !settings.remote.path) throw new Error('Remote address not specified')

  this.url = url

  if (settings) {
    this.baseUrl = settings.remote.path
  }
}

HTTPStorage.prototype.getFullUrl = function () {
  if (this.baseUrl) {
    return urljoin(this.baseUrl, this.url.replace('/http/', ''))
  } else {
    return this.url
  }
}

HTTPStorage.prototype.get = function () {
  return new Promise((resolve, reject) => {
    this.tmpFile = path.join(tmpDirectory, sha1(this.url) + '-' + Date.now() + path.extname(this.url))

    var options = {
      headers: {
        'User-Agent': 'Image Handler'
      }
    }

    var download = wget.download(this.getFullUrl(), this.tmpFile, options)

    download.on('error', (error) => {
      var err

      if (typeof error === 'string' && error.indexOf('404') > -1) {
        err = {
          statusCode: '404',
          message: 'Not Found: ' + this.getFullUrl()
        }

        return reject(err)
      } else {
        return reject(error)
      }
    })

    download.on('end', (output) => {
      return resolve(fs.createReadStream(this.tmpFile))
    })
  })
}

/**
 * Removes the temporary file downloaded from the remote server
 */
HTTPStorage.prototype.cleanUp = function () {
  try {
    fs.unlinkSync(this.tmpFile)
  } catch (err) {
    console.log(err)
  }
}

module.exports = function (settings, url) {
  return new HTTPStorage(settings, url)
}

module.exports.HTTPStorage = HTTPStorage
