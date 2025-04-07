import React from 'react';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <h1>Добре дошли в системата за управление на етажна собственост</h1>
      <div className="features">
        <div className="feature-card">
          <h3>Управление на сгради</h3>
          <p>Добавяйте и управлявайте сгради, етажи и апартаменти</p>
        </div>
        <div className="feature-card">
          <h3>Финансово управление</h3>
          <p>Следете депозити и задължения за всеки апартамент</p>
        </div>
        <div className="feature-card">
          <h3>Справки</h3>
          <p>Генерирайте подробни справки за финансовото състояние</p>
        </div>
      </div>
    </div>
  );
};

export default Home; 