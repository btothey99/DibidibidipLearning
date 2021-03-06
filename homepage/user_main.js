// video tag의 DOM element를 player로 지정합니다.
var player = document.getElementById("player");
var stopButton = document.getElementById("pause");
// 웹캠 사용권한이 승인되는 경우 스트리밍 영상을 player의 재생대상으로 지정
var handleSuccess = function (stream) {
  player.srcObject = stream;
};

navigator.mediaDevices.getUserMedia({ video: true }).then(handleSuccess);
  // 현재 사용중인 브라우저 객체(navigator)의 mediaDevices 인터페이스를
  // 이용하여 사용자의 미디어 입력장치 사용권한을 받습니다.

stopButton.addEventListener("click", function () {
 stream = player.srcObject;
 tracks = stream.getTracks();
 tracks.forEach(function (track) {
   track.pause();
 });
 player.srcObject = null;
});
