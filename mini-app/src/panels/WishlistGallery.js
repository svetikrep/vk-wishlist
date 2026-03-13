import React, { useState } from 'react';
import bridge from '@vkontakte/vk-bridge';
import {
  Button,
  Div,
  FormItem,
  Input,
  CardGrid,
  Card,
  Headline,
  Text,
  IconButton,
  Spinner,
  Tappable,
} from '@vkontakte/vkui';
import { Icon28DeleteOutline, Icon28PictureOutline } from '@vkontakte/icons';

// Кеш изображений
const imageCache = {};

// Класс для формирования URL картинки с Wildberries по ссылке
class GenerateImgUrl {
  constructor(nmId, photoSize = "big", photoNumber = 1, format = "webp") {
    if (typeof nmId !== "number" || nmId < 0) {
      throw new Error("Invalid nmId value");
    }
    this.nmId = parseInt(nmId, 10);
    this.size = photoSize;
    this.number = photoNumber;
    this.format = format;
  }

  id(vol) {
    if (vol <= 143) return "01";
    if (vol <= 287) return "02";
    if (vol <= 431) return "03";
    if (vol <= 719) return "04";
    if (vol <= 1007) return "05";
    if (vol <= 1061) return "06";
    if (vol <= 1115) return "07";
    if (vol <= 1169) return "08";
    if (vol <= 1313) return "09";
    if (vol <= 1601) return "10";
    if (vol <= 1655) return "11";
    if (vol <= 1919) return "12";
    if (vol <= 2045) return "13";
    if (vol <= 2189) return "14";
    if (vol <= 2405) return "15";
    if (vol <= 2621) return "16";
    if (vol <= 2837) return "17";
    if (vol <= 3053) return "18";
    if (vol <= 3269) return "19";
    if (vol <= 3485) return "20";
    if (vol <= 3701) return "21";
    if (vol <= 4000) return "22";
    if (vol <= 5000) return "23";
    if (vol <= 6000) return "24";
    if (vol <= 7000) return "25";
    if (vol <= 8000) return "26";
    if (vol <= 9000) return "27";
    if (vol <= 10000) return "28";
    if (vol <= 11000) return "29";
    if (vol <= 12000) return "30";
    if (vol <= 13000) return "31";
    if (vol <= 14000) return "32";
    return "33";
  }
}

//
const checkDirectImageUrl = (url, timeout = 1500) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error('not found'));
    img.src = url;
    setTimeout(() => reject(new Error('timeout')), timeout);
  });
};

const getWildberriesImageUrl = async (article) => {
  const cacheKey = `wb_${article}`;
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  const nmId = parseInt(article, 10);
  const vol = Math.floor(nmId / 100000);
  const part = Math.floor(nmId / 1000);

  const generator = new GenerateImgUrl(nmId, "big", 1, "webp");
  const primaryBasket = generator.id(vol);

  const getHost = (basket, type) => {
    if (type === 'wb') return `https://basket-${basket}.wbbasket.ru`;
    if (type === 'ekt') return `https://ekt-basket-cdn-${basket}.geobasket.ru`;
    if (type === 'geo') return `https://basket-${basket}.geobasket.ru`;
  };

  const hostTypes = ['wb', 'ekt', 'geo'];
  const primaryUrls = [];

  for (const type of hostTypes) {
    primaryUrls.push(`${getHost(primaryBasket, type)}/vol${vol}/part${part}/${nmId}/images/big/1.webp`);
    primaryUrls.push(`${getHost(primaryBasket, type)}/vol${vol}/part${part}/${nmId}/images/big/1.jpg`);
  }

  try {
    const url = await Promise.any(primaryUrls.map(u => checkDirectImageUrl(u, 1000)));
    imageCache[cacheKey] = url;
    return url;
  } catch (e) {
    
  }

  const allBaskets = Array.from({ length: 40 }, (_, i) => String(i + 1).padStart(2, '0'));
  
  const fallbackUrlsWebp = [];
  const fallbackUrlsJpg = [];
  
  for (const basket of allBaskets) {
    if (basket !== primaryBasket) {
      for (const type of hostTypes) {
        fallbackUrlsWebp.push(`${getHost(basket, type)}/vol${vol}/part${part}/${nmId}/images/big/1.webp`);
        fallbackUrlsJpg.push(`${getHost(basket, type)}/vol${vol}/part${part}/${nmId}/images/big/1.jpg`);
      }
    }
  }

  try {
    const url = await Promise.any(fallbackUrlsWebp.map(u => checkDirectImageUrl(u, 2500)));
    imageCache[cacheKey] = url;
    return url;
  } catch (e) {
    try {
      const url = await Promise.any(fallbackUrlsJpg.map(u => checkDirectImageUrl(u, 2500)));
      imageCache[cacheKey] = url;
      return url;
    } catch (finalError) {
      imageCache[cacheKey] = null;
      return null;
    }
  }
};

const parseWildberriesLink = (input) => {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/(https?:\/\/)?(www\.)?(wildberries\.ru|wb\.ru)\/catalog\/\d+[^\s]*/i);
  if (!urlMatch) return null;
  
  const url = urlMatch[0];
  const articleMatch = url.match(/\/catalog\/(\d+)/);
  if (articleMatch) {
    return articleMatch[1];
  }
  return null;
};

// Основа
const WishlistGallery = ({ wishes, setWishes, showForm, setShowForm }) => {
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFoundError, setNotFoundError] = useState(false);

  const handleAddWish = async () => {
    if (!link.trim()) {
      setError('Введите ссылку');
      return;
    }

    setLoading(true);
    setError('');
    setNotFoundError(false);

    const article = parseWildberriesLink(link);
    if (!article) {
      setError('Это не похоже на ссылку Wildberries');
      setLoading(false);
      return;
    }

    if (article.length < 5) {
      setNotFoundError(true);
      setLoading(false);
      return;
    }

    if (!/^\d+$/.test(article)) {
      setError('Некорректный артикул');
      setLoading(false);
      return;
    }

    const imageUrl = await getWildberriesImageUrl(article);
    
    if (!imageUrl) {
      setNotFoundError(true);
      setLoading(false);
      return;
    }

    const cleanUrl = `https://www.wildberries.ru/catalog/${article}/detail.aspx`;

    const newWish = {
      id: Date.now(),
      link: cleanUrl,
      image: imageUrl,
      article: article
    };

    setWishes([newWish, ...wishes]);
    setLink('');
    setShowForm(false);
    setLoading(false);
  };

  const deleteWish = (id) => {
    setWishes(wishes.filter(w => w.id !== id));
  };

  const resetNotFound = () => {
    setNotFoundError(false);
    setLink('');
    setError('');
  };

  if (notFoundError) {
    return (
      <Div style={{ textAlign: 'center', paddingTop: 32 }}>
        <Div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
          <Icon28PictureOutline width={56} height={56} fill="var(--vkui--color_icon_secondary)" />
        </Div>
        <Headline level="2" weight="2" style={{ marginBottom: 8 }}>
          Такой товар не найден
        </Headline>
        <Text style={{ marginBottom: 24, color: 'var(--vkui--color_text_secondary)' }}>
          Проверьте корректность ссылки и попробуйте снова.
        </Text>
        <Div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button size="l" mode="primary" onClick={() => { resetNotFound(); setShowForm(true); }}>
            Добавить желание
          </Button>
          <Button size="l" mode="secondary" onClick={() => { resetNotFound(); setShowForm(false); }}>
            Вернуться на главную
          </Button>
        </Div>
      </Div>
    );
  }

  if (!showForm) {
    if (wishes.length === 0) {
      return (
        <Div style={{ textAlign: 'center', paddingTop: 32 }}>
          <Div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Icon28PictureOutline width={56} height={56} fill="var(--vkui--color_icon_secondary)" />
          </Div>
          <Headline level="2" weight="2" style={{ marginBottom: 8 }}>
            Список желаний пуст
          </Headline>
          <Text style={{ marginBottom: 24, color: 'var(--vkui--color_text_secondary)' }}>
            Добавляйте ссылки на товары с Wildberries
          </Text>
          <Button size="l" mode="primary" onClick={() => setShowForm(true)}>
            Добавить первое желание
          </Button>
        </Div>
      );
    }

    return (
      <CardGrid size="m" style={{ padding: 8 }}>
        {wishes.map((wish) => (
          <Card
            key={wish.id}
            mode="shadow"
            style={{ 
              aspectRatio: '3/4', 
              borderRadius: 12, 
              overflow: 'hidden' 
            }}
          >
            <Tappable
              href={wish.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{ position: 'relative', width: '100%', height: '100%', display: 'block' }}
            >
              <img
                src={wish.image}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/300x400?text=Нет+фото';
                }}
              />
              <IconButton
                style={{ 
                  position: 'absolute', 
                  top: 4, 
                  right: 4, 
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 2 
                }}
                onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation(); 
                  deleteWish(wish.id); 
                }}
              >
                <Icon28DeleteOutline fill="#fff" />
              </IconButton>
            </Tappable>
          </Card>
        ))}
      </CardGrid>
    );
  }

  return (
    <Div>
      <FormItem top="Ссылка на товар Wildberries">
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://www.wildberries.ru/catalog/12345678/detail.aspx"
        />
      </FormItem>

      {loading && (
        <Div style={{ margin: 20, textAlign: 'center' }}>
          <Spinner size="l" />
          <Div style={{ marginTop: 8 }}>Добавляем в вишлист...</Div>
        </Div>
      )}

      {error && (
        <Text style={{ color: 'var(--vkui--color_text_negative)', margin: 10 }}>
          {error}
        </Text>
      )}

      <Div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button size="l" stretched mode="secondary" onClick={() => { setShowForm(false); setError(''); setLink(''); }}>
          Отмена
        </Button>
        <Button size="l" stretched mode="primary" onClick={handleAddWish} disabled={!link || loading}>
          Добавить
        </Button>
      </Div>
    </Div>
  );
};

export default WishlistGallery;