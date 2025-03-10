# webNote

## 课题:笔记管理系统

### 概述:

本课题要求学生设计并实现一个“笔记管理系统”。学生需综合运用所学的 HTML5、CSS、 JavaScript 和 DOM 操作来完成该项目。项目需要在 32 学时内完成,涵盖任务的添加、编辑、删除和状态更新等功能。

### 技术要求:

不允许使用任何现有的 CSS 框架。不允许使用 jQuery 等 JavaScript 工具库或 Vue.js、React 等界面库。必须使用原生 DOM API 实现相应功能。可以参考和借鉴现有框架和库的代码片段,推荐自行封装常用功能。

### 功能实现：

1. 实现了笔记分类的功能，用户可以添加新的分类
2. 用户可以拖拽笔记进行排序
3. 用户可以将笔记拖拽到左侧的分类中进行分组
4. 实时渲染markdown基本语法
5. 有最近删除功能，删除笔记后可以在最近删除中复原
6. 在最近删除中删除笔记将无法复原笔记
7. 支持搜索功能，可以搜索笔记标题和内容
8. 实现了三种主题切换，会根据用户浏览器默认主题进行更换
9. 笔记分类名不能为空，或者重复
10. 笔记名不能为空
11. 笔记名在当前分类下不能重复
12. 显示默认的“全部笔记”、“未分类”和"最近删除"三个条目。
13. 提供“新建笔记”按钮,点击后输入笔记名，创建一条新笔记