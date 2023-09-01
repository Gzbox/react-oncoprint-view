# react-oncoprint-view

[![NPM version](https://img.shields.io/npm/v/react-oncoprint-view.svg?style=flat)](https://npmjs.org/package/react-oncoprint-view)
[![NPM downloads](http://img.shields.io/npm/dm/react-oncoprint-view.svg?style=flat)](https://npmjs.org/package/react-oncoprint-view)

A react library developed with dumi

## Demo

![demo.png](./demo.png)

## Usage

```bash
yarn add react-oncoprint-view
```

然后（点击可查看 [mockData.js](./mockData.js) 数据详情）

```js
// 就可以看到效果了
import { OncoPrintView } from 'react-oncoprint-view';
import { mockData } from './mockData';
export default <OncoPrintView {...mockData} />;
```

## Development

```bash
# install dependencies
$  yarn install

# develop library by docs demo
$ yarn dev

# build library source code
$ yarn run build

# build library source code in watch mode
$ yarn run build:watch

# build docs
$ yarn run docs:build

# check your project for potential problems
$ yarn run doctor
```
