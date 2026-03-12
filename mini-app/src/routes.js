import {
  createHashRouter,
  createPanel,
  createRoot,
  createView,
  RoutesConfig,
} from '@vkontakte/vk-mini-apps-router';

export const DEFAULT_VIEW_PANELS = {
  HOME: 'home',
  CALENDAR: 'calendar',
};

export const routes = RoutesConfig.create([
  createRoot(DEFAULT_ROOT, [
    createView(MAIN_VIEW, [
      createPanel(DEFAULT_VIEW_PANELS.HOME, '/', []),
      createPanel(DEFAULT_VIEW_PANELS.CALENDAR, '/calendar', []),
    ]),
  ]),
]);

export const router = createHashRouter(routes.getRoutes());