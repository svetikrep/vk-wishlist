import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Panel,
  Button,
  Div,
  CardGrid,
  Card,
  Headline,
  Text,
  IconButton,
  FixedLayout,
  ModalCard,
} from '@vkontakte/vkui';
import { Icon28AddOutline, Icon28DeleteOutline, Icon28PictureOutline, Icon28CancelOutline } from '@vkontakte/icons';

const STORAGE_KEY = 'wishlist_gallery';

// Функция сжатия изображения
const resizeImage = (file, maxWidth = 300) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const WishlistGallery = () => {
  const [wishes, setWishes] = useState([]);
  const [viewerOpened, setViewerOpened] = useState(false);
  const [currentWish, setCurrentWish] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setWishes(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  }, [wishes]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageBase64 = await resizeImage(file, 400);
      const newWish = {
        id: Date.now(),
        image: imageBase64,
      };
      setWishes([...wishes, newWish]);
    } catch (err) {
      console.error('Ошибка при обработке изображения', err);
    }

    // Очищаем input, чтобы можно было выбрать тот же файл повторно
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const deleteWish = (id) => {
    setWishes(wishes.filter(w => w.id !== id));
  };

  const openViewer = (wish) => {
    setCurrentWish(wish);
    setViewerOpened(true);
  };

  return (
    <View activePanel="main">
      <Panel id="main">
        {wishes.length === 0 ? (
          <Div style={{ textAlign: 'center', paddingTop: 32 }}>
            <Icon28PictureOutline width={56} height={56} fill="var(--vkui--color_icon_secondary)" style={{ marginBottom: 16 }} />
            <Headline level="2" weight="2" style={{ marginBottom: 8 }}>
              Галерея пуста
            </Headline>
            <Text style={{ marginBottom: 24, color: 'var(--vkui--color_text_secondary)' }}>
              Добавляйте картинки, чтобы создать свою коллекцию.
            </Text>
            <Button size="l" mode="primary" onClick={() => fileInputRef.current.click()}>
              Добавить первое желание
            </Button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Div>
        ) : (
          <>
            <CardGrid size="m" style={{ padding: 8 }}>
              {wishes.map((wish) => (
                <Card key={wish.id} mode="shadow" onClick={() => openViewer(wish)} style={{ cursor: 'pointer', aspectRatio: '1/1' }}>
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      src={wish.image}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <IconButton
                      style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)' }}
                      onClick={(e) => { e.stopPropagation(); deleteWish(wish.id); }}
                    >
                      <Icon28DeleteOutline fill="#fff" />
                    </IconButton>
                  </div>
                </Card>
              ))}
            </CardGrid>
            <FixedLayout vertical="bottom">
              <Div style={{ padding: 16 }}>
                <Button size="l" stretched onClick={() => fileInputRef.current.click()} before={<Icon28AddOutline />}>
                  Добавить желание
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </Div>
            </FixedLayout>
          </>
        )}

        {viewerOpened && currentWish && (
          <ModalCard
            onClose={() => setViewerOpened(false)}
            style={{ minHeight: 400, padding: 0 }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={currentWish.image}
                alt=""
                style={{ width: '100%', borderRadius: 8 }}
              />
              <IconButton
                style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={() => setViewerOpened(false)}
              >
                <Icon28CancelOutline fill="#fff" />
              </IconButton>
            </div>
          </ModalCard>
        )}
      </Panel>
    </View>
  );
};

export default WishlistGallery;