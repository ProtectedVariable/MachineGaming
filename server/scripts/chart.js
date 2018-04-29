const fitChart = new Chart(document.getElementById("canvasFitness").getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Average",
            fill: false,
            borderColor: "rgb(218, 13, 19)",
            data:
                [

                ]
        }]
    },
    options: {
      scales: {
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: 'Fitness Value'
          }
      }],
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Generation #'
        }
    }],
      }
    }
});
