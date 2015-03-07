# net-socket

net.Socket that automatically reconnects if a server goes down.
Maintains 100% compatibility with net.Socket.

### Installation

```
$ npm install net-socket --save
```

### Usage

For detailed usage, see Node.js documentation on net.Socket - https://nodejs.org/api/net.html#net_class_net_socket.

Quick example:

```javascript
var net = require('net-socket');

var socket = net.connect(7777, 'localhost');

socket.setEncoding('utf8');
socket.on('connect', function () {
	// connected
	
	socket.end('hey');
	socket.destroy();
});
```

**WARNING**: To prevent socket from reconnecting, use `.destroy()` method to completely close it.

### Tests

[![Circle CI](https://circleci.com/gh/vdemedes/net-socket.svg?style=svg)](https://circleci.com/gh/vdemedes/net-socket)

```
$ npm test
```

### License

WTFPL – Do What the Fuck You Want to Public License
