/**
 * Dependencies
 */

var delegate = require('delegates');
var net = require('net');


/**
 * Socket v2
 */

function Socket (options) {
  this.socket = new net.Socket(options);
  this._connectTimeout = undefined;
  this.monitor();
}


/**
 * Socket prototype
 */

var socket = Socket.prototype;


/**
 * Remember connection arguments for reconnection
 */

socket.connect = function () {
  this._connectArgs = arguments;
  
  return this.socket.connect.apply(this.socket, arguments);
};


/**
 * Reconnect timeout management
 */

socket._stopReconnectTimer = function () {
  if (this._connectTimeout) {
    clearTimeout(this._connectTimeout);
    this._connectTimeout = undefined;
  }
}

socket._startReconnectTimer = function (delay) {
  var self = this;
  this._stopReconnectTimer();

  this._connectTimeout = setTimeout(function () {
    self._reconnect();
  }, delay);

  return this._connectTimeout;
}

/**
 * Stop monitoring
 */

socket.destroy = function () {
  this._stopReconnectTimer();
  this.socket.removeAllListeners();
  
  return this.socket.destroy();
};


/**
 * Reconnect on close
 */

socket.monitor = function () {
  var self = this;
  
  var backoff = 1.5;
  var delay = 1000;
  
  this.socket.on('connect', function () {
    self._stopReconnectTimer();
    delay = 1000;
  });

  this.socket.on('close', function () {
    self._startReconnectTimer(delay);
    delay *= backoff;
  });
  
  this.socket.on('error', function (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      return;
    };
    
    throw err;
  });
};

socket._reconnect = function () {
  if (this.socket._connecting) return;
  
  this.socket.connect.apply(this.socket, this._connectArgs);
};


/**
 * Proxy net.Socket methods and properties
 */

var methods = [
  // net.Socket
  'setEncoding',
  'write',
  'end',
  'pause',
  'resume',
  'setTimeout',
  'setNoDelay',
  'setKeepAlive',
  'address',
  'unref',
  'ref',
  
  // EventEmitter
  'addListener',
  'on',
  'once',
  'removeListener',
  'removeAllListeners',
  'setMaxListeners',
  'listeners',
  'emit'
];

var properties = [
  // net.Socket
  'bufferSize',
  'remoteAddress',
  'remoteFamily',
  'remotePort',
  'localAddress',
  'localPort',
  'bytesRead',
  'bytesWritten',
  
  // EventEmitter
  'defaultMaxListeners',
];

methods.forEach(function (method) {
  socket[method] = function () {
    return this.socket[method].apply(this.socket, arguments);
  };
});

properties.forEach(function (property) {
  delegate(socket, 'socket').access(property);
});


/**
 * Expose connect method
 */


exports.connect = exports.createConnection = function (port, host, connectionListener) {
  var options = {};
  
  if (typeof port === 'object') options = port;
  if (typeof port === 'string') options.path = port;
  if (typeof port === 'number') options.port = port;
  
  if (typeof host === 'function') connectionListener = host;
  if (typeof host === 'string') options.host = host;
  
  var socket = new Socket();
  socket.connect(options, connectionListener);
  return socket;
};
