/**
 * This module is an abstract representation of a computing client
 *
 * @author Thomas Ibanez
 * @version 1.0
 */
"use strict";
function Client(wname) {
    this.name = wname;
    this.status = "Waiting...";
    this.busy = false;
    this.genomeID = -1;
}

module.exports.Client = Client;
