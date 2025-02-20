import React, { useEffect, useState } from 'react';
import token from '../token.json';
import ip from '../ip.json';
import JiraTicketDetails from './JiraTicket';
import '../widgets/JiraTiket.css';

const NewsComponent = ({ index }) => {
  const [userData, setUserData] = useState([]);
  const token_uk = token.token_uk; // Замените на ваш токен

  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("accept", "application/json, text/plain, */*");
    myHeaders.append("accept-language", "ru,en;q=0.9,la;q=0.8");
    myHeaders.append("appname", "lk-tg.domyland.ru");
    myHeaders.append("appversion", "3.0.0");
    myHeaders.append("authorization", token_uk);
    myHeaders.append("buildingid", "18289");
    myHeaders.append("origin", "https://lk-tg.domyland.ru");
    myHeaders.append("placeid", "2545483");
    myHeaders.append("priority", "u=1, i");
    myHeaders.append("referer", "https://lk-tg.domyland.ru/");
    myHeaders.append("sec-ch-ua", "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"YaBrowser\";v=\"24.7\", \"Yowser\";v=\"2.5\"");
    myHeaders.append("sec-ch-ua-mobile", "?0");
    myHeaders.append("sec-ch-ua-platform", "\"Windows\"");
    myHeaders.append("sec-fetch-dest", "empty");
    myHeaders.append("sec-fetch-mode", "cors");
    myHeaders.append("sec-fetch-site", "same-site");
    myHeaders.append("timezone", "Asia/Yekaterinburg");
    myHeaders.append("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 YaBrowser/24.7.0.0 Safari/537.36");
    myHeaders.append("withcredentials", "true");

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch(`http://${ip.ip}:${ip.port}/https://customer-api.domyland.ru/newsfeed?fromRow=0`, requestOptions)
      .then(res => res.json())
      .then(result => setUserData(result.data.items))
      .catch((error) => console.error(error));
  }, [token_uk, ip]);

  if (userData[index]) {
    return (
      <div className="flex flex-col col-span-full sm:col-span-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">{userData[index].title}</h2>
        <p className="font-semibold text-gray-800 dark:text-gray-100">{userData[index].preview}</p>
        <p>
          <a href={userData[index].shared.link} className="text-blue-500 hover:underline">Ссылка</a>
        </p>
      </div>
    );
  }

  return <div></div>;
};
const ticket = {
  key: 'SCRUM-23',
  summary: 'As a user, I\'d like a historical story to show in reports',
  status: 'DONE',
  assignee: 'admin',
};
const NewsList = () => {
  return (
    <div>
      {/* {Array.from({ length: 6 }, (_, index) => (
        <NewsComponent key={index} index={index} />
      ))} */}
      <JiraTicketDetails ticket={ticket} />
    </div>
  );
};

export default NewsList;
