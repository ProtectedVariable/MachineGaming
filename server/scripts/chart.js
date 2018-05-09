const fitChart = new Chart(document.getElementById("canvasFitness").getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Average Fitness",
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

const bestfitChart = new Chart(document.getElementById("canvasFitness2").getContext('2d'), {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: "Maximum Fitness",
            fill: false,
            borderColor: "rgb(19, 33, 218)",
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
