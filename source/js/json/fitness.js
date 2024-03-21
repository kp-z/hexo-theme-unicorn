
function GetHistoryCounterUpRecord(xhr, index) {
  var times_history = [];
  var item = xhr.data[index];
  var times = item.counterUp;
  var items_history = item.history.slice(-11);
  for (var i = 0; i < items_history.length; i++) {
    times_history.push(items_history[i].scoredUp);
  }
  times_history.push(times);
  return times_history;
}

function GetTodoTasks(data) {
  var todo_tasks = [];
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    if (item.type = "todo") {
      todo_tasks.push(item);
    }
  }
  return todo_tasks;
}

function GetTodaysTasks(data) {
  var today_tasks = [];
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    var now_date = new Date();
    if (item.date == now_date) {
      today_tasks.push(item);
    }
  }
  return today_tasks;
}

function GetFlagTasks(data) {
  var flag_tasks = [];
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    if (item.tags.indexOf("7b2d53e9-1ca7-471f-95a1-b29bdd90b885") > -1) {
      flag_tasks.push(item);
    }
  }
  return flag_tasks;
}

$.ajax({
  url: 'https://habitica.com/api/v3/tasks/user',
  type: 'GET',
  dataType: 'json',
  cache: false,
  beforeSend: function (xhr) {
    xhr.setRequestHeader('x-client', '5daf7fb2-df95-4ad4-a157-f7c6809b4907-ZKPEACE');
    xhr.setRequestHeader('x-api-user', '5daf7fb2-df95-4ad4-a157-f7c6809b4907');
    xhr.setRequestHeader('x-api-key', '7defefe4-e90c-4f05-9174-bb23e1c9ea1a');
  },

  success: function (xhr) {
    console.log(xhr);

    fitness_times_history = GetHistoryCounterUpRecord(xhr, 0);
    meditation_times_history = GetHistoryCounterUpRecord(xhr, 1);
    basketball_times_history = GetHistoryCounterUpRecord(xhr, 2);
    drawExerciseChart(fitness_times_history, meditation_times_history);

    var month_execercise_times = [0, basketball_times_history[basketball_times_history.length - 1],
      meditation_times_history[meditation_times_history.length - 1],
      fitness_times_history[fitness_times_history.length - 1]];

    $("#meditation-times").html(month_execercise_times[2] + " Times");
    $("#fitness-times").html(month_execercise_times[3] + " Times");
    $("#others-times").html(month_execercise_times[1] + " Times");

    drawFitnessCircle(month_execercise_times);

    var todo_tasks = GetTodoTasks(xhr.data);
    var today_tasks = GetTodaysTasks(todo_tasks);
    var flag_tasks = GetFlagTasks(todo_tasks);

    $("#all").html("<div class='logo'><i class='fas fa-inbox'></i></div> <div class='num'>" + todo_tasks.length + "</div> <div class='title'>All</div>");
    $("#plan").html("<div class='logo'><i class='fas fa-calendar-alt'></i></div> <div class='num'>" + todo_tasks.length + "</div> <div class='title'>Todo</div>");
    $("#today").html("<div class='logo'><i class='fas fa-calendar-day'></i></div> <div class='num'>" + today_tasks.length + "</div> <div class='title'>Today</div>");
    $("#flag").html("<div class='logo'><i class='fas fa-star'></i></div> <div class='num'>" + flag_tasks.length + "</div> <div class='title'>Flag</div>");


  },
  // error: console.log('Error'),
});

$.ajax({
  url: 'https://habitica.com/export/userdata.json',
  type: 'GET',
  dataType: 'json',
  cache: false,
  beforeSend: function (xhr) {
    xhr.setRequestHeader('x-client', '5daf7fb2-df95-4ad4-a157-f7c6809b4907-ZKPEACE');
    xhr.setRequestHeader('x-api-user', '5daf7fb2-df95-4ad4-a157-f7c6809b4907');
    xhr.setRequestHeader('x-api-key', '7defefe4-e90c-4f05-9174-bb23e1c9ea1a');
  },
  success: function (xhr) {
    // var meditation_times_history = [10, 20, 23, 25, 29, 22];
    // var fitness_times_history = [10, 20, 23, 25, 29, 22];
    // var meditation_times = 0;
    // var fitness_times = 0;

    var sevenDaysComplete = [];
    var sevenDaysDate = [];
    // var month_execercise_times = [0];
    var name = xhr.profile.name;
    var stats = xhr.stats;
    var todos = xhr.tasks.todos;
    var completeArray = generateCompletedArray();

    // console.log(completeArray[0].date);
    for (var i = 0; i < todos.length; i++) {




      if (todos[i].completed) {
        var tmpTodoDate = todos[i].dateCompleted.substr(0, 10);
        // console.log('Todo Date: '+tmpTodoDate);
        for (var j = 0; j < completeArray.length; j++) {
          var tmpDate = completeArray[j].date;
          if (tmpTodoDate == tmpDate) {
            completeArray[j].times++;
            // console.log('Times++');
          }
        }
      }
    }
    // console.log(completeArray.length);
    for (var k = 0; k < completeArray.length; k++) {
      sevenDaysComplete.push(completeArray[k].times);
      sevenDaysDate.push(completeArray[k].date);
    }
    // console.log(j);

    // console.log(sevenDaysComplete);
    $("#habitica-block-1").html(
      "<div class='habitic-profile'>" + name + "</div><div class='habitic-class'>CLASS : " + 'ROGUE' + "</div><div class='habitic-level'>LEVEL : " + stats.lvl + "</div><div id='habitic-profile-stats' class='habitic-stats'></div>"
    );

    $("#habitica-block-4").html('<div class="today-todo-title-1">TODAY</div><a class="today-todo-num">'
      + sevenDaysComplete[sevenDaysComplete.length - 1]
      + '</a><div class="today-todo-title-2"><p class="today-todo-kill">KILLED</p><p>tasks was</p></div>');


    // $("#habitica-block-2").html('Strength: ' + stats.str + '\nintelligence: ' + stats.int + '\nConstitution: ' + stats.con + '\nPerception: ' + stats.per);
    // $("#habitica-block-1").html(name);

    // drawFitnessCircle(month_execercise_times);
    drawCompletedTasksChart(sevenDaysDate, sevenDaysComplete);
    drawStatsChart(stats.hp, stats.mp, stats.exp);
  },
  // error: console.log('Error'),
});


function generateCompletedArray() {
  var completedAarray = [];
  // var startTime = getDate('2022-05-01')
  var endTime = new Date();
  var startTime = new Date(endTime.getTime() - 86400000 * 6);
  // console.log(endTime.getTime());
  // console.log(endTime);

  while ((endTime.getTime() - startTime.getTime()) >= 0) {
    var year = startTime.getFullYear();
    var month = (startTime.getMonth() + 1).toString().length == 1 ? "0" + (startTime.getMonth() + 1).toString() : (startTime.getMonth() + 1).toString();
    var day = startTime.getDate().toString().length == 1 ? "0" + startTime.getDate() : startTime.getDate();
    // date_all[i] = year + "-" + month + "-" + day;
    var tmpCompleted = {
      date: year + "-" + month + "-" + day,
      times: 0
    }
    completedAarray.push(tmpCompleted);
    startTime.setDate(startTime.getDate() + 1);
    // i += 1;
  }
  // console.log(completedAarray);
  return completedAarray;
}

function getDate(datestr) {
  var temp = datestr.split("-");
  var date = new Date(temp[0], temp[1] - 1, temp[2]);
  return date;
}


function drawFitnessCircle(month_execercise_times) {
  var fitnessCircleChartDom = document.getElementById('fitness-circle');
  var fitnessCircleChart = echarts.init(fitnessCircleChartDom);
  var fitnessCircleOption;
  var fitnessCircleData = ['0', '1', '2', '3']
  fitnessCircleOption = {
    grid: {
      top: "0",
      right: "0",
    },
    angleAxis: {
      show: false,
      max: 20
    },
    radiusAxis: {
      show: false,
      type: 'category',
      data: fitnessCircleData,
      z: 10,
    },
    polar: {},
    series: [
      {
        type: 'bar',
        data: month_execercise_times,
        coordinateSystem: 'polar',
        colorBy: "data",
        roundCap: true,
        showBackground: true
      },
    ]
  };

  fitnessCircleOption && fitnessCircleChart.setOption(fitnessCircleOption);
}

function drawCompletedTasksChart(sevenDaysDate, sevenDaysComplete) {
  var completedTodosChartDom = document.getElementById('habitica-block-3');
  var completedTodosChart = echarts.init(completedTodosChartDom);
  var completedTodosOption;
  completedTodosOption = {
    tooltip: {
      trigger: 'axis'
    },
    grid: [
      {
        top: '10%',
        height: '85%',
        left: '0%',
        bottom: '5%',
        right: '10%',
        // show: true,
        // borderColor: "rgba(128, 128, 128, 0.4)",
        // borderWidth: ".1"
      },
    ],
    xAxis: {
      show: false,
      type: 'category',
      boundaryGap: false,
      data: sevenDaysDate,
    },
    yAxis: {
      show: false,
      type: 'value'
    },
    series: [
      {
        name: 'Compeleted: ',
        type: 'line',
        stack: 'Total',
        smooth: true,
        itemStyle: {
          color: '#83ccd2'
        },
        data: sevenDaysComplete,
      }
    ]
  };
  completedTodosOption && completedTodosChart.setOption(completedTodosOption);
}


function drawStatsChart(hp, mp, exp) {
  var statsChartDom = document.getElementById('habitica-block-2');
  var statsChart = echarts.init(statsChartDom);
  var statsOption;
  statsOption = {
    tooltip: {
      trigger: 'axis'
    },
    grid: [
      {
        top: '10%',
        height: '60%',
        left: '0%',
        bottom: '5%',
        right: '10%',
        // show: true,
        // borderColor: "rgba(128, 128, 128, 0.4)",
        // borderWidth: ".1"
      },
    ],
    xAxis: {
      show: false,
      type: 'value',
      boundaryGap: false,
      // max: function (value) {
      //   // console.log(value);
      //   return value.max + 20;

      // }
      max: 100
    },
    yAxis: {
      show: false,
      type: 'category',
      data: ['Exp', 'MP', 'HP']
    },
    series: [
      {
        type: 'bar',
        stack: 'Total',
        smooth: true,
        // data: [exp, mp ,hp],
        data: [

          {
            value: mp / 52 * 100,
            itemStyle: {
              color: '#74b9ff',
            },
          },
          {
            value: exp / 280 * 100,
            itemStyle: {
              color: '#f1c40f',
            },
          },
          {
            value: hp / 50 * 100,
            itemStyle: {
              color: '#ba5140',
            }
          },
        ],
        showBackground: true,
        backgroundStyle: {
          borderRadius: 4,

        },
        itemStyle: {
          borderRadius: 4
        }
      }
    ]
  };
  statsOption && statsChart.setOption(statsOption);
}

function drawExerciseChart(fitness_times_history, meditation_times_history) {
  var exerciseChartDom = document.getElementById('fitness-line');
  var exerciseChart = echarts.init(exerciseChartDom);
  var exerciseOption;

  exerciseOption = {
    grid: [
      {
        top: '5%',
        height: '45%',
        left: '0%',
        right: '0%',
        show: true,
        borderColor: "rgba(128, 128, 128, 0.4)",
        borderWidth: ".1"
      },
      {
        bottom: '5%',
        height: '45%',
        left: '0%',
        right: '0%',
        show: true,
        borderColor: "rgba(128, 128, 128, 0.4)",
        borderWidth: ".1"
      },
    ],
    xAxis: [
      {
        type: 'category',
        data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        gridIndex: 0,
        axisLabel: {
          show: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            width: '.1',
            color: ["rgba(128, 128, 128, 0.4)"],
          }
        },
        axisLine: {
          onZero: false,
          show: false,
          lineStyle: {
            width: '.1',
            color: ["rgba(128, 128, 128, 0.4)"],
          }
        },
        axisTick: {
          show: false
        },
      },
      {
        type: 'category',
        data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        gridIndex: 1,
        axisLine: {
          onZero: false,
          show: false,
          lineStyle: {
            width: '.1',
            color: ["rgba(128, 128, 128, 0.4)"],
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          show: true,
          inside: false
        },
        splitLine: {
          show: true,
          lineStyle: {
            width: '.1',
            color: ["rgba(128, 128, 128, 0.4)"],
          }
        }
      },
    ],
    yAxis: [
      {
        type: 'value', gridIndex: 0, show: false, max: 35,

      },
      {
        type: 'value', gridIndex: 1, show: false, max: 35,
      },
    ],
    series: [
      {
        name: 'Meditation',
        type: 'bar',
        data: fitness_times_history,
        xAxisIndex: 1,
        yAxisIndex: 1,
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        markLine: {
          data: [{ type: 'average', name: 'Avg' }],
          width: 0.1,
          symbol: 'none',
          lineStyle: {
            opacity: 0.5
          }
        }
      },
      {
        name: 'Fitness',
        type: 'bar',
        data: meditation_times_history,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: {
          borderRadius: [4, 4, 0, 0]
        },
        markLine: {
          data: [{ type: 'average', name: 'Avg' }],
          width: 0.1,
          symbol: 'none',
          lineStyle: {
            opacity: 0.5
          }
        }
      },
    ]
  };

  exerciseOption && exerciseChart.setOption(exerciseOption);
}
