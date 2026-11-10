// 로컬에서 열면 내 컴퓨터의 서버, 배포된 사이트에서 열면 Railway 서버를 사용합니다.
window.API_BASE = ["localhost", "127.0.0.1"].includes(location.hostname)
  ? "http://localhost:8000"
  : "https://myapi-production-1cf2.up.railway.app";
