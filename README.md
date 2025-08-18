# Fast Import

在import引入和解构赋值的时候更加快速。

## 教程

使用 `Alt+I` 快捷键可以智能识别并快速定位到以下两种场景：

### Import 引入

当光标在import引入语句附近时：

```javascript
import {} from "vue";
```

按下`Alt+I`会快速将光标移动到`{}`内，方便快速引入具体的模块。

对于默认引入方式：

```javascript
import from "vue";
```

会将光标移动到`import`后面。

### 解构赋值

当光标在const、let或var解构赋值语句附近时：

```javascript
const {} = someObject;
let {} = someObject;
var {} = someObject;
```

按下`Alt+I`会快速将光标移动到`{}`内，方便快速添加需要解构的属性。

如果不存在大括号，会将光标移动到`const`、`let`或`var`关键字后面。

## 智能识别

插件会自动识别当前光标位置附近的语句类型：

1. 优先查找import引入语句
2. 如果没有找到import，则查找解构赋值语句
3. 如果都没有找到，会显示提示信息

## 快捷键

- `Alt+I` - 智能快速定位（支持import引入和解构赋值）
