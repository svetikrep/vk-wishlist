import React from 'react';
import { Button, Panel, View } from '@vkontakte/vkui';

const TestPanel = () => {
  console.log('✅ TestPanel загружен');
  const handleClick = () => {
    console.log('✅ Кнопка нажата');
    alert('Кнопка работает!');
  };
  return (
    <View activePanel="test">
      <Panel id="test">
        <Button onClick={handleClick} size="l" stretched>
          Тестовая кнопка
        </Button>
      </Panel>
    </View>
  );
};

export default TestPanel;