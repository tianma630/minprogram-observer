const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

function Observer(component, data) {
  this.component = component;
  this.data = data;

  this.init = function () {
    patchMethod();
    observeData(this.data);
    proxyData(this.component, this.data);
  }

  function patchMethod() {
    methodsToPatch.forEach(function (method) {
      const original = arrayProto[method];
      def(arrayMethods, method, function (...args) {
        const result = original.apply(this, args);
        let inserted = null;
        switch (method) {
          case 'push':
          case 'unshift':
            inserted = args;
            break;
          case 'splice':
            inserted = args.slice(2);
            break;
        }

        component.setData({
          [this.__mpexpr__]: this
        });
        return result;
      });
    });
  }

  function observeData(data, expr) {
    if (Object.prototype.toString.call(data) === '[object Object]') {
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'object' && data[key].length) {
          observeArray(key, data[key], expr || '');
        } else {
          defineDirective(data, key, data[key], expr || '');
        }
      });
    }
  }

  function proxyData(component, data) {
    Object.keys(data).forEach(key => {
      Object.defineProperty(component, key, {
        get() {
          return data[key];
        },
        set(newValue) {
          data[key] = newValue;
        }
      });
    })
  }

  function defineDirective(data, key, value, expr) {
    let __mpexpr__ = expr + (expr && '.') + key
    observeData(value, __mpexpr__);
    Object.defineProperty(data, key, {
      get() {
        return value;
      },
      set: (newValue) => {
        if (value !== newValue) {

          component.setData({
            [__mpexpr__]: newValue
          });

          observeData(newValue, __mpexpr__);
          value = newValue;
        }
      }
    });
  }

  function observeArray(key, array, expr) {
    let __mpexpr__ = expr + (expr && '.') + key
    array.__proto__ = arrayMethods;
    def(array, '__mpexpr__', __mpexpr__);
  }

}

// ### deep copy ###

const mapTag = '[object Map]';
const setTag = '[object Set]';
const arrayTag = '[object Array]';
const objectTag = '[object Object]';
const argsTag = '[object Arguments]';

const boolTag = '[object Boolean]';
const dateTag = '[object Date]';
const numberTag = '[object Number]';
const stringTag = '[object String]';
const symbolTag = '[object Symbol]';
const errorTag = '[object Error]';
const regexpTag = '[object RegExp]';
const funcTag = '[object Function]';

const deepTag = [mapTag, setTag, arrayTag, objectTag, argsTag];


function forEach(array, iteratee) {
  let index = -1;
  const length = array.length;
  while (++index < length) {
    iteratee(array[index], index);
  }
  return array;
}

function isObject(target) {
  const type = typeof target;
  return target !== null && (type === 'object' || type === 'function');
}

function getType(target) {
  return Object.prototype.toString.call(target);
}

function getInit(target) {
  const Ctor = target.constructor;
  return new Ctor();
}

function cloneSymbol(targe) {
  return Object(Symbol.prototype.valueOf.call(targe));
}

function cloneReg(targe) {
  const reFlags = /\w*$/;
  const result = new targe.constructor(targe.source, reFlags.exec(targe));
  result.lastIndex = targe.lastIndex;
  return result;
}

function cloneFunction(func) {
  const bodyReg = /(?<={)(.|\n)+(?=})/m;
  const paramReg = /(?<=\().+(?=\)\s+{)/;
  const funcString = func.toString();
  if (func.prototype) {
    const param = paramReg.exec(funcString);
    const body = bodyReg.exec(funcString);
    if (body) {
      if (param) {
        const paramArr = param[0].split(',');
        return new Function(...paramArr, body[0]);
      } else {
        return new Function(body[0]);
      }
    } else {
      return null;
    }
  } else {
    return eval(funcString);
  }
}

function cloneOtherType(targe, type) {
  const Ctor = targe.constructor;
  switch (type) {
    case boolTag:
    case numberTag:
    case stringTag:
    case errorTag:
    case dateTag:
      return new Ctor(targe);
    case regexpTag:
      return cloneReg(targe);
    case symbolTag:
      return cloneSymbol(targe);
    case funcTag:
      return cloneFunction(targe);
    default:
      return null;
  }
}

function clone(target, map = new WeakMap()) {

  // 克隆原始类型
  if (!isObject(target)) {
    return target;
  }

  // 初始化
  const type = getType(target);
  let cloneTarget;
  if (deepTag.includes(type)) {
    cloneTarget = getInit(target, type);
  } else {
    return cloneOtherType(target, type);
  }

  // 防止循环引用
  if (map.get(target)) {
    return map.get(target);
  }
  map.set(target, cloneTarget);

  // 克隆set
  if (type === setTag) {
    target.forEach(value => {
      cloneTarget.add(clone(value, map));
    });
    return cloneTarget;
  }

  // 克隆map
  if (type === mapTag) {
    target.forEach((value, key) => {
      cloneTarget.set(key, clone(value, map));
    });
    return cloneTarget;
  }

  // 克隆对象和数组
  const keys = type === arrayTag ? undefined : Object.keys(target);
  forEach(keys || target, (value, key) => {
    if (keys) {
      key = value;
    }
    cloneTarget[key] = clone(target[key], map);
  });

  return cloneTarget;
}

module.exports = {
  Observer,
  clone,
};
