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
} from '@vkontakte/vkui';
import { Icon28DeleteOutline, Icon28PictureOutline } from '@vkontakte/icons';

// ---------- Кеш изображений ----------
const imageCache = {};

// ---------- Класс для формирования URL изображения Wildberries ----------
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

  url() {
    const vol = Math.floor(this.nmId / 100000);
    const part = Math.floor(this.nmId / 1000);
    const basket = this.id(vol);
    return `https://basket-${basket}.wbbasket.ru/vol${vol}/part${part}/${this.nmId}/images/${this.size}/${this.number}.${this.format}`;
  }
}

// ---------- Вспомогательные функции ----------
const checkImageUrl = (url, timeout = 3000) => {
  return Promise.race([
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    }),
    new Promise((resolve) => setTimeout(() => resolve(false), timeout))
  ]);
};

const getWildberriesImageUrl = async (article) => {
  const cacheKey = `wb_${article}`;
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  const stored = localStorage.getItem(cacheKey);
  if (stored) {
    const cached = JSON.parse(stored);
    imageCache[cacheKey] = cached.url;
    return cached.url;
  }

  const nmId = parseInt(article, 10);
  const vol = Math.floor(nmId / 100000);
  const part = Math.floor(nmId / 1000);

  const generator = new GenerateImgUrl(nmId, "big", 1, "webp");
  const basketFromAlgo = generator.id(vol);

  const domains = ['wbbasket.ru', 'geobasket.ru'];
  const variants = [
    { size: "big", number: 1, format: "webp" },
    { size: "big", number: 1, format: "jpg" },
    { size: "hq", number: 1, format: "webp" },
    { size: "hq", number: 1, format: "jpg" },
    { size: "c516x688", number: 1, format: "webp" },
    { size: "c516x688", number: 1, format: "jpg" },
    { size: "big", number: 0, format: "jpg" },
    { size: "big", number: 2, format: "jpg" },
  ];

  for (const domain of domains) {
    for (const v of variants) {
      let directUrl;
      if (domain === 'geobasket.ru') {
        directUrl = `https://ekt-basket-cdn-${basketFromAlgo}.${domain}/vol${vol}/part${part}/${nmId}/images/${v.size}/${v.number}.${v.format}`;
      } else {
        directUrl = `https://basket-${basketFromAlgo}.${domain}/vol${vol}/part${part}/${nmId}/images/${v.size}/${v.number}.${v.format}`;
      }
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(directUrl)}`;
      const ok = await checkImageUrl(proxyUrl, 2000);
      if (ok) {
        console.log(`Найдена картинка (алгоритм): ${domain}, корзина ${basketFromAlgo}, ${v.size}/${v.number}.${v.format}`);
        imageCache[cacheKey] = proxyUrl;
        localStorage.setItem(cacheKey, JSON.stringify({ url: proxyUrl, timestamp: Date.now() }));
        return proxyUrl;
      }
    }
  }

  const popularBaskets = ['31', '33', '08', '15', '10', '11', '12', '13', '01', '02', '03', '22'];
  for (const basket of popularBaskets) {
    for (const domain of domains) {
      for (const v of variants) {
        let directUrl;
        if (domain === 'geobasket.ru') {
          directUrl = `https://ekt-basket-cdn-${basket}.${domain}/vol${vol}/part${part}/${nmId}/images/${v.size}/${v.number}.${v.format}`;
        } else {
          directUrl = `https://basket-${basket}.${domain}/vol${vol}/part${part}/${nmId}/images/${v.size}/${v.number}.${v.format}`;
        }
        const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(directUrl)}`;
        const ok = await checkImageUrl(proxyUrl, 2000);
        if (ok) {
          console.log(`Найдена картинка (перебор): ${domain}, корзина ${basket}, ${v.size}/${v.number}.${v.format}`);
          imageCache[cacheKey] = proxyUrl;
          localStorage.setItem(cacheKey, JSON.stringify({ url: proxyUrl, timestamp: Date.now() }));
          return proxyUrl;
        }
      }
    }
  }

  console.log('Не удалось найти картинку для артикула', article);
  imageCache[cacheKey] = null;
  return null;
};

// Расширенная функция для извлечения артикула из любого текста, содержащего ссылку Wildberries
const parseWildberriesLink = (input) => {
  // Убираем лишние пробелы и переносы строк
  const trimmed = input.trim();
  
  // Ищем URL, начинающийся с wildberries.ru или wb.ru, возможно с http:// или без
  const urlMatch = trimmed.match(/(https?:\/\/)?(www\.)?(wildberries\.ru|wb\.ru)\/catalog\/\d+[^\s]*/i);
  if (!urlMatch) return null;
  
  const url = urlMatch[0];
  
  // Из найденного URL извлекаем артикул (число после /catalog/)
  const articleMatch = url.match(/\/catalog\/(\d+)/);
  if (articleMatch) {
    return articleMatch[1];
  }
  
  return null;
};

const openLink = async (url) => {
  try {
    await bridge.send('VKWebAppOpenExternalUrl', { url });
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// ---------- Основной компонент ----------
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

    if (article.length < 7) {
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

    const newWish = {
      id: Date.now(),
      link: link,
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

  const goToForm = () => {
    resetNotFound();
    setShowForm(true);
  };

  const goToMain = () => {
    resetNotFound();
    setShowForm(false);
  };

  // Контент без View и Panel
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
          <Button size="l" mode="primary" onClick={goToForm}>
            Добавить желание
          </Button>
          <Button size="l" mode="secondary" onClick={goToMain}>
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
            onClick={() => openLink(wish.link)}
            style={{ cursor: 'pointer', aspectRatio: '3/4', borderRadius: 12 }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img
                src={wish.image}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 12,
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/300x400?text=Нет+фото';
                }}
              />
              <IconButton
                style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)' }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  deleteWish(wish.id); 
                }}
              >
                <Icon28DeleteOutline fill="#fff" />
              </IconButton>
            </div>
          </Card>
        ))}
      </CardGrid>
    );
  }

  // Форма добавления
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
          <Div style={{ marginTop: 8 }}>Добавляем в вишлист</Div>
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