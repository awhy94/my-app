import { useEffect } from 'react';
import yach from 'yach.open.jssdk';

import { request, cancelAllRequest } from './utils/fetch.ts'

import logo from './logo.svg';
import './App.css';

function App() {
  useEffect(() => {
    yach.biz.navigation.setRight({
      text: "right",
      onSuccess: function (result) {
        console.log('wenai-result', result);
        yach.on("rightBtnClick", () => {
          console.log('wenai-rightBtnClick, 事件监听成功')
        });
      },
      onFail: function () {},
    });
  }, []);

  const onClickGetUserInfo = async () => {
    const result = await request({
      url: 'http://127.0.0.1:3010/userinfo/get',
      method: 'get',
      requestKey: 'getUserInfo'
    });

    console.log('onClickGetUserInfo', result);
  }

  const onClickCancelAllRequest = () => {
    cancelAllRequest();
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p onClick={onClickGetUserInfo}>触发 getInfo 接口请求</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
