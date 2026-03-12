import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import {
  SplitLayout,
  SplitCol,
  ScreenSpinner,
  PanelHeader,
  Avatar,
} from '@vkontakte/vkui';
import WishlistGallery from './panels/WishlistGallery';

bridge.send('VKWebAppInit');

function App() {
  const [fetchedUser, setUser] = useState();
  const [popout, setPopout] = useState(<ScreenSpinner />);

  useEffect(() => {
    async function fetchData() {
      const user = await bridge.send('VKWebAppGetUserInfo');
      setUser(user);
      setPopout(null);
    }
    fetchData();
  }, []);

  return (
    <SplitLayout>
      <SplitCol>
        <PanelHeader
          before={fetchedUser && <Avatar size={36} src={fetchedUser.photo_100} />}
        >
          Галерея желаний {fetchedUser ? fetchedUser.first_name : ''}
        </PanelHeader>
        <WishlistGallery fetchedUser={fetchedUser} />
      </SplitCol>
      {popout}
    </SplitLayout>
  );
}

export default App;