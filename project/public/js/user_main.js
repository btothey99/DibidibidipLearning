window.onload = function () {
    if (window.Notification) {
        Notification.requestPermission();
    }
}

function calculate() {
    setTimeout(function () {
        notify();
    }, 5000);
}

function notify() {
    if (Notification.permission !== 'granted') {
        alert('notification is disabled');
    }
    else {
        var notification = new Notification('Notification title', {
            icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
            body: 'Notification text',
        });

        notification.onclick = function () {
            window.open('http://google.com');
        };
    }
  }


// Element 에 style 한번에 오브젝트로 설정하는 함수 추가
Element.prototype.setStyle = function(styles) {
  for (var k in styles) this.style[k] = styles[k];
  return this;
};

document.getElementById('popup_open_btn').addEventListener('click', function() {
  // 모달창 띄우기
  modal('my_modal');
});
