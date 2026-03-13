import vkBridge, { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge';
import { useAdaptivity, useAppearance, useInsets } from '@vkontakte/vk-bridge-react';
import { AdaptivityProvider, ConfigProvider, AppRoot } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

import { transformVKBridgeAdaptivity } from './utils';
import App from './App';

export const AppConfig = () => {
  const vkBridgeAppearance = useAppearance() || undefined;
  const adaptivity = transformVKBridgeAdaptivity(useAdaptivity());
  const insets = useInsets();
  const { vk_platform } = parseURLSearchParamsForGetLaunchParams(window.location.search);

  return (
    <ConfigProvider
      colorScheme={vkBridgeAppearance}
      platform={vk_platform === 'desktop_web' ? 'vkcom' : undefined}
      isWebView={vkBridge.isWebView()}
      hasCustomPanelHeaderAfter={true}
    >
      <AdaptivityProvider {...adaptivity}>
        {/* Передаём safeAreaInsets в AppRoot */}
        <AppRoot mode="full" safeAreaInsets={insets}>
          <App />
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  );
};