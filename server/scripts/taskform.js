refreshForm();

function refreshForm() {
    let gameId = $("#tgame").val();
    let netId = $("#tnet").val();
    $("#ttopo").children().each(function() {
        if(gameId == Math.floor($(this).val() / 10000) && netId == Math.floor($(this).val() / 1000) % 10) {
            this.disabled = false;
            this.hidden = false;
        } else {
            this.disabled = true;
            this.selected = false;
            this.hidden = true;
        }
    });
}
