import { defineConfig } from 'dumi';

export default defineConfig({
  /**
   * @see  https://d.umijs.org/guide/auto-api-table
   */
  apiParser: {},
  resolve: {
    // 配置入口文件路径，API 解析将从这里开始
    entryFile: './src/index.ts',
  },
  outputPath: 'docs-dist',
  themeConfig: {
    name: 'oncoprint',
  },
});
