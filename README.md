## Overview
Content-Distrib is built on Node.JS, with support for S3 and Redis. It is a high performance, just-in-time asset manipulation and delivery layer designed as a modern content distribution solution.

It is designed to carry the processing and delivery load associated with image manipulation and asset delivery (CSS/JS/fonts). It acts autonomously as a layer on top of your core product.

It has full support for caching, header control, image manipulation, image compression and image format conversion. An authenticated API allows for fine grained cache control in the form of content invalidation on an individual file or collective path basis.

## Installation

- Image Libraries
```
$ sudo apt-get install libcairo2-dev libjpeg-dev libgif-dev
```
- Sqwish CSS Compressor
```
$ sudo npm install -g sqwish
```
- Upgrade GCC++ Compiler
```
$ sudo add-apt-repository ppa:ubuntu-toolchain-r/test
$ sudo apt-get update -y
$ sudo apt-get install gcc-4.9 g++-4.9
$ sudo update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-4.9 60 --slave /usr/bin/g++ g++ /usr/bin/g++-4.9
```
- Npm install
```
$ npm install
```

## Run
If you have installed manually, you can run tests by:
```
$ npm run test
```
