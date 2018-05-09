"use strict";
function Client(wname) {
    this.name = wname;
    this.status = "Waiting...";
    this.busy = false;
    this.genomeID = -1;
}

module.exports.Client = Client;
