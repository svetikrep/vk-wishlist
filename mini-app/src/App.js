import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { useInsets } from '@vkontakte/vk-bridge-react';
import {
  View,
  Panel,
  PanelHeader,
  SplitLayout,
  SplitCol,
  ScreenSpinner,
  Avatar,
  Div,
  Headline,
  Text,
  Separator,
  Button,
} from '@vkontakte/vkui';
import { Icon28AddOutline, Icon28ShareOutline, Icon24UserOutline, Icon24UsersOutline, Icon28PictureOutline } from '@vkontakte/icons';
import WishlistGallery from './panels/WishlistGallery';

const STORAGE_KEY = 'wishlist_links';

bridge.send('VKWebAppInit');

function App() {
  const insets = useInsets();

  const [fetchedUser, setUser] = useState();
  const [popout, setPopout] = useState(<ScreenSpinner />);
  const [wishes, setWishes] = useState([]);
  const [activeView, setActiveView] = useState('main');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setWishes(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  }, [wishes]);

  useEffect(() => {
    async function fetchData() {
      const user = await bridge.send('VKWebAppGetUserInfo');
      setUser(user);
      setPopout(null);
    }
    fetchData();
  }, []);

  const getWishesText = (count) => {
    if (count === 0) return '0 желаний';
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} желаний`;
    if (lastDigit === 1) return `${count} желание`;
    if (lastDigit >= 2 && lastDigit <= 4) return `${count} желания`;
    return `${count} желаний`;
  };

  const shareWishlist = () => {
    if (wishes.length === 0) {
      bridge.send('VKWebAppShare', { message: 'Мой вишлист пока пуст :(' });
      return;
    }
    const text = wishes.map((wish, index) => `${index + 1}. ${wish.link}`).join('\n');
    bridge.send('VKWebAppShare', {
      link: '',
      message: `Мои желания на Wildberries:\n${text}`,
    });
  };

  const handleAddClick = () => {
    setActiveView('main');
    setShowForm(true);
  };

  const FriendsPanel = () => (
    <Div style={{ textAlign: 'center', paddingTop: 32 }}>
      <Div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <Icon28PictureOutline width={56} height={56} fill="var(--vkui--color_icon_secondary)" />
      </Div>
      <Headline level="2" weight="2" style={{ marginBottom: 8 }}>
        Список друзей
      </Headline>
      <Text style={{ marginBottom: 24, color: 'var(--vkui--color_text_secondary)' }}>
        Здесь скоро появятся вишлисты ваших друзей.
      </Text>
    </Div>
  );

  const topInset = insets?.top ?? 0;
  const bottomInset = insets?.bottom ?? 0;

  return (
    <SplitLayout style={{ height: '100vh' }}>
      <SplitCol style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <View activePanel="main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Panel id="main" style={{ border: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <PanelHeader 
              delimiter="none" 
              style={{ 
                boxShadow: 'none', 
                border: 'none', 
                background: 'transparent',
                margin: 0,
                padding: 0
              }}
            >
              iWish</PanelHeader>

            {/* Кастомный блок с аватаркой и иконками */}
            <Div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar size={48} src={fetchedUser?.photo_100} />
                <div>
                  <Headline level="2" weight="2">
                    Вишлист {fetchedUser?.first_name}
                  </Headline>
                  <Text style={{ color: 'var(--vkui--color_text_secondary)' }}>
                    {getWishesText(wishes.length)}
                  </Text>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <Icon28ShareOutline onClick={shareWishlist} style={{ cursor: 'pointer' }} />
                <div
                  onClick={handleAddClick}
                  style={{
                    backgroundColor: 'var(--vkui--color_background_accent_themed)',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--vkui--color_text_contrast_themed)',
                  }}
                >
                  <Icon28AddOutline fill="currentColor" />
                </div>
              </div>
            </Div>

            <Separator style={{ margin: 0 }} />

            {/* Контент с прокруткой */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeView === 'main' ? (
                <WishlistGallery
                  wishes={wishes}
                  setWishes={setWishes}
                  showForm={showForm}
                  setShowForm={setShowForm}
                />
              ) : (
                <FriendsPanel />
              )}
            </div>

            {/* Нижняя панель */}
            <div
              style={{
                background: 'var(--vkui--color_background_content)',
                backdropFilter: 'blur(10px)',
                borderTop: '1px solid var(--vkui--color_separator_primary)',
                padding: `8px 16px ${bottomInset + 8}px 16px`,
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <Button
                size="l"
                stretched
                mode="tertiary"
                onClick={() => setActiveView('main')}
                style={{ opacity: activeView === 'main' ? 1 : 0.5 }}
                before={<Icon24UserOutline />}
              >
                Мой вишлист
              </Button>
              <Button
                size="l"
                stretched
                mode="tertiary"
                onClick={() => setActiveView('friends')}
                style={{ opacity: activeView === 'friends' ? 1 : 0.5 }}
                before={<Icon24UsersOutline />}
              >
                Друзья
              </Button>
            </div>
          </Panel>
        </View>
      </SplitCol>
      {popout}
    </SplitLayout>
  );
}

export default App;