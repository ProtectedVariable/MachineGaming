const mgclient = require('./client.js');

function Pool() {
    this.workers = {};
}

Pool.prototype.addWorker = function(id, name) {
    this.workers[id] = new mgclient.Client(name);
}

Pool.prototype.removeWorker = function(id) {
    delete this.workers[id];
}

module.exports.Pool = Pool;
