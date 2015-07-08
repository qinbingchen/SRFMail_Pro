# SessionHistoryKit

### 使用方法

#### 初始化 `SessionHistory` 对象

```javascript
var sessionHistory = SessionHistoryKit.SessionHistory(containerId, options);
```

参数 | 含义
--- | ---
containerId | 用于存放 Session History 的 HTML 节点的 ID
options | 配置选项

#### 设置数据

```javascript
sessionHistory.setOperations(operations);
```

参数 | 含义
--- | ---
operations | operation 数组

#### 绘制

```javascript
sessionHistory.draw();
```

#### 可选参数

参数 | 含义
--- | ---
width | 图像区域宽度，默认为`750`
height | 图像区域高度，默认为`100`
mainColor | 线条和节点颜色，默认为`#FE9509`
lineWidth | 线条粗细，默认为`2`
tipBackgroundColor | ToolTip 背景颜色，默认为`#000000`
tipTextColor | ToolTip 文字颜色，`#ffffff`
cardWidth | 悬浮卡片宽度，默认为`225`
radius | 节点半径，默认为`4`
hoverRadius | 鼠标悬停时节点半径，默认为`8`
spacingCoefficient | 节点间距系数，默认为`0.001`。该数值越大节点间距越大
maxSpacing | 最大节点间距，默认为`200`
minSpacing | 最小节点间距，默认为`30`（该数值不要小于 2 倍最大节点半径）


### 使用示例

```html
<div id="history"></div>		
<script src="history-kit.js"></script>
<script>
	var sessionHistory = new SessionHistoryKit.SessionHistory('history', {
		width: 750,
		height: 100
	});
	var operations = []; // populate the operation array
	sessionHistory.setOperations(operations);
	sessionHistory.draw();
</script>
```

效果：

<img src="http://img.renfei.org/2015/07/shk.png" width="446" height="169">

可运行的实例可参考 `history.html`。
