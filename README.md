## minprogram-observer
使用vue语法在小程序中实现数据更新

## demo

```javascript
const observer = require('./observer.js');

Page({
  data: {
    name: '2j',
    user: {
      id: 1
    },
    sets: ['a', 'b', 'c']
  },
  created() {
    new observer.Observer(this, observer.clone(this.data)).init();

    setTimeout(() => {
      this.name = 'aa'
      this.user.id = 'bb'
      this.sets.unshift('ccc')
    }, 3000);
  }
})
```
