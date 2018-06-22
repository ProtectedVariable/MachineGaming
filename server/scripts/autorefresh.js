function refreshInfos() {
    $.ajax({url: "/status", success: function(result) {
        //Update Header
        if(result.currentGame != "-") {
            $("#ctask").text(`Current Task: ${result.currentGame} ( ${result.remainingCycles} generation(s) remaining )`);
        }

        //Change buttons enable state
        let disabled = result.remainingCycles > 0;
        $(".gen").prop('disabled', disabled);
        $(".pause").prop('disabled', result.remainingCycles <= 1)

        //Update chart
        let update = result.avgFitnesses[result.avgFitnesses.length - 1] != fitChart.data.datasets[0].data[fitChart.data.datasets[0].data.length - 1];
        for (let i in result.avgFitnesses) {
            fitChart.data.labels[i] = (Math.max(0, parseFloat(result.currentGeneration) - 50) + parseFloat(i));
            fitChart.data.datasets[0].data[i] = result.avgFitnesses[i];
        }

        //Update chart
        for (let i in result.bestFitnesses) {
            bestfitChart.data.labels[i] = (Math.max(0, parseFloat(result.currentGeneration) - 50) + parseFloat(i));
            bestfitChart.data.datasets[0].data[i] = result.bestFitnesses[i];
        }

        if(update) {
            fitChart.update();
            bestfitChart.update();
        }

        //Update workers
        let whtml = "";
        let index = 0;
        for(let wi in result.workers) {
            if(index % 3 == 0) {
                if(index != 0) {
                    whtml += "</div>"
                }
                whtml += '<div class="card-deck" style="width: 100%;">';
            }

            whtml += '<div class="card w-75" style="max-width: 30%">'
            whtml += '<div class="card-body">';
            whtml += '<h5 class="card-title">'+result.workers[wi].name+" ("+index+")</h5>";
            whtml += '<p class="card-text"> '+result.workers[wi].status+' </p>';
            whtml += '</div>'
            whtml += "</div>"
            index++
        }
        if(index > 0) {
            $("#wdiv").html(whtml);
        } else {
            $("#wdiv").html("<p style='color: red'> No Workers</p>");
        }
    }, complete: function() {
        setTimeout(refreshInfos(), 2000);
    }
    });
}

refreshInfos();
