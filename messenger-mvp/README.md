# Talk MVP HTML Prototype

이 프로젝트는 카카오톡 스타일의 메시징 MVP 화면을 HTML/CSS/JS로 확인하기 위한 정적 프로토타입입니다.

## 포함된 화면

- Splash: `index.html`
- 로그인: `login.html`
- 회원가입: `signup.html`
- 홈: `home.html`
- 친구 목록: `pages/friends.html`
- 친구 프로필: `pages/friend_profile.html`
- 채팅 목록: `pages/chat_list.html`
- 채팅방: `pages/chat_room.html`
- 설정: `pages/settings.html`
- 프로필 수정: `pages/profile.html`

## 실행 방법

1. 압축을 풀고 프로젝트 폴더를 연다.
2. `index.html`을 연다.
3. 각 화면의 버튼과 링크를 눌러 동작을 확인한다.

## 채팅방 동작

`pages/chat_room.html`에서 확인할 수 있는 동작은 아래와 같습니다.

- 채팅 목록에서 대화방을 누르면 `chat_room.html`로 이동한다.
- 채팅방 안에서 대화 말풍선을 길게 누르면 팝업 메뉴가 열린다.
- 팝업 메뉴의 `답장`을 눌러야만 답장 미리보기가 나타난다.
- 답장 미리보기의 `X` 버튼을 누르면 답장 영역이 닫히고, 일반 메시지 입력창만 남는다.
- 팝업 메뉴의 `저장`을 누르면 선택 모드로 전환된다.
- 팝업 메뉴의 `삭제`를 누르면 선택 모드로 전환된다.
- 선택 모드에서는 각 메시지 왼쪽에 선택 버튼이 나타난다.
- 선택 모드에서는 하단 액션 바가 나타난다.
- 선택 모드를 종료하면 다시 일반 메시지 입력창으로 돌아간다.

## 주요 파일

- 채팅방 마크업: `pages/chat_room.html`
- 채팅방 동작 로직: `assets/js/app.js`
- 채팅방 및 팝업 스타일: `assets/css/style.css`

## 참고

이 프로젝트는 정적 MVP 확인용이며, 실제 DB나 실시간 채팅 연동은 포함하지 않습니다.
