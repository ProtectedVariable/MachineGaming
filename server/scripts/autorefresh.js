let lastFitChartSize = 0;

function refreshInfos() {
    $.ajax({url: "/status", success: function(result) {
        //Update Header
        if(result.currentGame != "-") {
            $("#ctask").text(`Current Task: ${result.currentGame} ( ${result.currentFitness} ) - ${result.remainingCycles} generation(s) remaining`);
        }

        //Change buttons enable state
        let disabled = result.remainingCycles > 0;
        $(".gen").prop('disabled', disabled);
        $(".pause").prop('disabled', result.remainingCycles <= 1)

        //Update chart
        let chartCount = 0;
        for (let i in result.fitnesses) {
            chartCount++;
            fitChart.data.labels[i] = i;
            fitChart.data.datasets[0].data[i] = result.fitnesses[i];
        }
        if(chartCount != lastFitChartSize) {
            fitChart.update();
            lastFitChartSize = chartCount;
        }

        //Update workers
        let whtml = "";
        let index = 0;
        for(let wi in result.workers) {
            console.log(wi);
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
            whtml += '<a class="btn btn-danger">Kick </a>';
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
        setTimeout(refreshInfos(), 1000);
    }
    });
}

refreshInfos();
