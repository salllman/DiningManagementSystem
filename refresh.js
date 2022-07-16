setInterval(() => {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  let time = hours + ":" + minutes + ":" + seconds;
  let timeStart = document.getElementById("timeStart").innerHTML;
  let timeEnd = document.getElementById("timeEnd").innerHTML;

  if (time === timeStart || time === timeEnd) {
    window.location.reload(true);
  }
}, 1);
