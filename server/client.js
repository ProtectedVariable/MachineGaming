function Client(wname) {
    this.name = wname;
    this.state = "Waiting...";
    this.busy = false;
    this.genomeID = -1;
}

module.exports.Client = Client;
