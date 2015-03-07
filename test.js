/**
 * Dependencies
 */

var socket = require('./');
var net = require('net');

require('chai').should();


/**
 * Tests
 */

describe ('net-socket', function () {
  it ('connect to server using host and port', function (done) {
    var server = net.createServer(function (connection) {
      server.close(done);
    });
    
    server.listen(7777);
    
    var conn = socket.connect({
      host: 'localhost',
      port: 7777
    }, function () {
      conn.destroy();
    });
  });
  
  it ('connect to server using only port', function (done) {
    var server = net.createServer(function (connection) {
      server.close(done);
    });
    
    server.listen(7777);
    
    var conn = socket.connect(7777, function () {
      conn.destroy();
    });
  });
  
  it ('reconnect if a server goes down', function (done) {
    var connections = 0;
    var connected = false;
    var server = net.createServer(function () {
      connections++;
    });
    
    server.listen(7777);
    
    var conn = socket.connect(7777);
    
    conn.on('connect', function () {
      connected = true;
    });
    
    conn.on('close', function () {
      connected = false;
    });
    
    delay(function () {
      connected.should.equal(true);
      conn.end();
      server.close(function () {
        delay(function () {
          connected.should.equal(false);
          server.listen(7777);
          
          delay(function () {
            connected.should.equal(true);
            connections.should.equal(2);
            conn.destroy();
            server.close(done);
          }, 1100);
        });
      });
    });
  });
  
  it ('send data', function (done) {
    var server = net.createServer(function (connection) {
      connection.on('data', function (data) {
        data.toString().should.equal('hello world');
        server.close(done);
      });
    });
    
    server.listen(7777);
    
    var conn = socket.connect(7777, 'localhost', function () {
      conn.end('hello world');
      conn.destroy();
    });
  });
  
  it ('send data while reconnecting', function (done) {
    var connections = 0;
    var message = '';
    var parts = ['hello', ' world'];
    
    var server = net.createServer(function (connection) {
      connections++;
      connection.on('data', function (data) {
        message += data.toString();
      });
    });
    
    server.listen(7777);
    
    var conn = socket.connect(7777);
    
    conn.on('connect', function () {
      conn.write(parts.shift());
    });
    
    delay(function () {
      message.should.equal('hello');
      conn.end();
      
      server.close(function () {
        server.listen(7777);
        
        delay(function () {
          message.should.equal('hello world');
          connections.should.equal(2);
          
          conn.destroy();
          server.close(done);
        }, 1100);
      });
    });
  });
});


/**
 * Shortcuts
 */

function delay (fn, ms) {
  setTimeout(fn, ms || 100);
}
