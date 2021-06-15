import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  alias: {
    // inft: '@/components',
  },

  define: {
    // Mainnet
    'process.env.chainId': 56,
    'process.env.rpcURL': 'https://bsc-dataseed1.binance.org/',
    // Testnet
    // 'process.env.chainId': 97,
    // 'process.env.rpcURL': 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  },

  locale: {
    default: 'en-US',
    antd: true,
    title: true,
    baseNavigator: true,
    baseSeparator: '-',
  },

  title: 'iNFT',
  favicon: '/favicon.ico',
  mode: 'site',
  logo: '/favicon.ico',
  description: '组件、工具等说明文档',

  theme: {
    '@primary-color': '#FED835',
  },
  routes: [
    {
      path: '/idolbox',
      component: '@/pages/idolbox',
    },
    {
      path: '/',
      component: '@/layouts/assets',
      routes: [
        {
          path: '/',
          redirect: '/home',
        },
        {
          path: '/home',
          component: '@/pages/home',
          title: 'title_home',
        },
        {
          path: '/market',
          component: '@/pages/market',
          title: 'title_market',
        },
        {
          path: '/market/:contract/:tokenId/:orderId',
          component: '@/pages/market/[contract][token-id][order-id]',
          title: 'title_detail',
        },
        {
          path: '/market/:contract/:tokenId/',
          component: '@/pages/market/[contract][token-id][order-id]',
          title: 'title_detail',
        },
        {
          path: '/account',
          component: '@/pages/account',
          title: 'title_account',
        },
      ],
    },
  ],
  fastRefresh: {},
});
