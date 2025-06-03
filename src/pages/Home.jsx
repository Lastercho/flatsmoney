import '../styles/Home.css';
import {Link} from "react-router-dom";

const Home = () => {
  return (
      <div className="home-page">
        <h1>Добре дошли в системата за управление на етажна собственост</h1>
        <h1>В помощ на Домоуправителя</h1>
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
          <div><br/><br/><br/>

          </div>
        <Link to="/login">
        <button type="submit" className="auth-button"
               >Вход
        </button>
        </Link>
          <br/><br/>
          <p>Нямате акаунт? <Link to="/register">Регистрирайте се</Link></p>

          <div className="footer">
              <h4>
                  Сайта не гарантира съхранението и запазването на въведените в него данни.<br/>

                  Всички данни и справки се създават единствено с цел улесняване домоуправителя във водене и отчитане приходи и разходи към сградата, като създателя не гарантира верността на информацията.
              </h4>
          </div>
      </div>

  );
};

export default Home; 