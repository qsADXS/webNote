// 确保在文件的开头定义
const notesData = JSON.parse(localStorage.getItem('notesData')) || {
    categories: [
        { id: 'default', name: '全部笔记' },
        { id: 'uncategorized', name: '未分类' },
        { id: 'recently-deleted', name: '最近删除' }
    ],
    notes: [
        {
            id: Date.now().toString(),
            title: '介绍',
            content: '1. 实现了笔记分类的功能，用户可以添加新的分类\n2. 用户可以拖拽笔记进行排序\n3. 用户可以将笔记拖拽到左侧的分类中进行分组\n4. 实时渲染markdown基本语法\n5. 有最近删除功能，删除笔记后可以在最近删除中复原\n6. 在最近删除中删除笔记将无法复原笔记\n7. 支持搜索功能，可以搜索笔记标题和内容\n8. 实现了三种主题切换，会根据用户浏览器默认主题进行更换\n9. 笔记分类名不能为空，或者重复\n10. 笔记名不能为空\n11. 笔记名在当前分类下不能重复',
            lastModified: new Date().toISOString(),
            categoryId: 'uncategorized'
        }
    ]
};

document.addEventListener('DOMContentLoaded', function() {
    const categoryList = document.getElementById('category-list');
    const noteList = document.getElementById('note-list');
    const noteListTitle = document.getElementById('note-list-title');
    const noteTitle = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const addCategoryButton = document.getElementById('add-category');
    const addNoteButton = document.getElementById('add-note');
    const clearStorageButton = document.getElementById('clear-storage');
    const markdownPreview = document.getElementById('markdown-preview');
    // const moveAllNotesButton = document.getElementById('move-all-notes');markdownPreview
    const buttonContainer = document.querySelector('.button-container');
    const searchInput = document.getElementById('search-notes');

    let currentCategory = 'default'; // 默分类
    let currentNoteId = null; // 当前选中的笔记ID
    let cancelButton = null; // 初始化取消按钮变量

    // 渲染分类列表
    function renderCategories() {
        categoryList.innerHTML = '';
        notesData.categories.forEach(category => {
            const li = document.createElement('li');
            li.textContent = category.name;
            li.dataset.id = category.id;

            // 添加拖放功能，仅用于接收笔记
            li.addEventListener('dragover', function(event) {
                event.preventDefault(); // 必须阻止默认行为才能触发 drop 事件
            });
            li.addEventListener('drop', function(event) {
                event.preventDefault();
                const dragType = event.dataTransfer.getData('type');
                if (dragType === 'note') {
                    const noteId = event.dataTransfer.getData('text/plain');
                    const note = notesData.notes.find(n => n.id === noteId);
                    if (note && note.categoryId !== category.id) {
                        moveNoteToCategory(noteId, category.id);
                    }
                }
            });

            // 添加删除按钮
            if (category.id !== 'default' && category.id !== 'uncategorized' && category.id !== 'recently-deleted') {
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '删除';
                deleteButton.addEventListener('click', function(event) {
                    event.stopPropagation(); // 阻止事件冒泡
                    if (confirm(`确定要删除分类 "${category.name}" 吗？此操作将删除该分类下的所有笔记，且不会放入"最近删除"`)) {
                        deleteCategory(category.id);
                    }
                });
                li.appendChild(deleteButton);
            }

            li.addEventListener('click', function() {
                currentCategory = category.id;
                displayNotes(currentCategory);
            });
            categoryList.appendChild(li);
        });
    }

    // 删除分类及其笔记
    function deleteCategory(categoryId) {
        // 删除分类
        notesData.categories = notesData.categories.filter(category => category.id !== categoryId);
        // 删除该分类下的所有笔记
        notesData.notes = notesData.notes.filter(note => note.categoryId !== categoryId);
        localStorage.setItem('notesData', JSON.stringify(notesData));
        renderCategories();
        displayNotes('default'); // 切换到显示所有笔记
    }

    // 显示笔记列表
    function displayNotes(categoryId, filterText = '') {
        noteList.innerHTML = '';
        const category = notesData.categories.find(cat => cat.id === categoryId);
        noteListTitle.textContent = category ? category.name : '笔记列表';

        let notes = notesData.notes.filter(note => {
            return note && note.categoryId && (note.categoryId === categoryId || (categoryId === 'default' && note.categoryId !== 'recently-deleted'));
        });

        if (filterText) {
            notes = notes.filter(note => note.title.toLowerCase().includes(filterText) || note.content.toLowerCase().includes(filterText));
        }

        notes.forEach(note => {
            const li = document.createElement('li');
            const formattedDate = new Date(note.lastModified).toLocaleString();
            li.textContent = `${note.title} (最后修改时间：${formattedDate})`;
            li.dataset.id = note.id;

            // 添加点击事件，加载笔记内容到编辑区域
            li.addEventListener('click', function() {
                currentNoteId = note.id;
                displayNoteContent(note);
            });

            // 添加删除按钮
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '删除';
            deleteButton.className = 'delete-note';
            deleteButton.addEventListener('click', function(event) {
                event.stopPropagation();
                if (categoryId === 'recently-deleted') {
                    // 从最近删除中彻底删除
                    deleteNote(note.id);
                } else {
                    // 移动到最近删除
                    moveNoteToCategory(note.id, 'recently-deleted');
                }
            });
            li.appendChild(deleteButton);

            // 如果在"最近删除"分类中，添加"还原"按钮
            if (categoryId === 'recently-deleted') {
                const restoreButton = document.createElement('button');
                restoreButton.textContent = '还原';
                restoreButton.className = 'restore-note';
                restoreButton.addEventListener('click', function(event) {
                    event.stopPropagation();
                    restoreNoteFromDeleted(note.id);
                });
                li.appendChild(restoreButton);
            }

            // 添加拖拽功能
            li.draggable = true;
            li.addEventListener('dragstart', function(event) {
                event.dataTransfer.setData('type', 'note'); // 标记为笔记
                event.dataTransfer.setData('text/plain', note.id);
            });

            noteList.appendChild(li);
        });
        if (currentCategory === 'recently-deleted') {
            addNoteButton.style.display = 'none';

        } else {
            addNoteButton.style.display = 'inline-block';

        }
    }

    //还原笔记
    function restoreNoteFromDeleted(noteId) {
        const note = notesData.notes.find(n => n.id === noteId);
        if (note) {
            // 检查原始分类是否存在
            const originalCategoryId = note.originalCategoryId;
            const categoryExists = notesData.categories.some(cat => cat.id === originalCategoryId);

            // 如果原始分类不存在，则将笔记添加到"未分类"
            const finalCategoryId = categoryExists ? originalCategoryId : 'uncategorized';

            // 1. 在还原之前，先判断目标分类中是否存在同名笔记
            const isDuplicate = notesData.notes.some(n => n.title === note.title && n.categoryId === finalCategoryId);
            if (isDuplicate) {
                alert('目标分类中已存在同名笔记，无法还原！');
                return;
            }

            // 2. 若不重复，则继续还原操作
            note.categoryId = finalCategoryId;
            delete note.originalCategoryId; // 移除原始分类标记
            note.lastModified = new Date().toISOString(); // 更新最后修改时间
            localStorage.setItem('notesData', JSON.stringify(notesData));
            displayNotes(currentCategory);
        }
    }

    // 删除笔记
    function deleteNote(noteId) {
        notesData.notes = notesData.notes.filter(note => note.id !== noteId);
        localStorage.setItem('notesData', JSON.stringify(notesData));
        displayNotes(currentCategory);
    }

    // 显示笔记内容
    function displayNoteContent(note) {
        noteTitle.value = note.title;
        noteContent.value = note.content;
        // 实时渲染 Markdown
        markdownPreview.innerHTML = renderMarkdown(note.content);

        // 检查当前分类是否为"最近删除"
        if (currentCategory === 'recently-deleted') {
            noteContent.style.display = 'none'; // 隐藏文本区域
            noteTitle.disabled = true; // 禁用标题输入框
        } else {
            noteContent.style.display = 'block'; // 显示文本区域
            noteTitle.disabled = false; // 启用标题输入框
        }
    }

    // 自动保存笔记
    function autoSaveNote() {
        if (currentNoteId) {
            const note = notesData.notes.find(n => n.id === currentNoteId);
            if (note) {
                const newTitle = noteTitle.value.trim();
                
                // 检查标题是否为空
                if (!newTitle) {
                    alert('笔记标题不能为空！');
                    noteTitle.value = note.title; // 恢复原始标题
                    return;
                }

                // 检查当前分类中是否已存在同名笔记
                const isDuplicate = notesData.notes.some(n => n.title === newTitle && n.categoryId === note.categoryId && n.id !== currentNoteId);
                if (isDuplicate) {
                    alert('当前分类中已存在同名笔记，无法修改标题！');
                    noteTitle.value = note.title; // 恢复原始标题
                    return;
                }

                note.title = newTitle;
                note.content = noteContent.value;
                note.lastModified = new Date().toISOString();
                localStorage.setItem('notesData', JSON.stringify(notesData));
                displayNotes(currentCategory); // 更新笔记列表显示
                console.log("markdown-preview");
                // 实时渲染 Markdown
                markdownPreview.innerHTML = renderMarkdown(note.content);
            }
        }
    }

    // 添加分类
    addCategoryButton.addEventListener('click', function() {
        const categoryName = prompt('请输入分类名称:');
        if (!categoryName.trim()) {
            alert('分类名称不能为空！');
            return;
        }
        if (notesData.categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
            alert('分类名称已存在！');
            return;
        }
        if (categoryName) {
            const newCategory = { id: Date.now().toString(), name: categoryName };
            notesData.categories.push(newCategory);
            localStorage.setItem('notesData', JSON.stringify(notesData));
            renderCategories();
        }
    });

    // 添加笔记
    addNoteButton.addEventListener('click', function() {
        const noteTitle = prompt('请输入笔记标题:');
        if (!noteTitle.trim()) {
            alert('笔记标题不能为空！');
            return;
        }
        // 确定笔记应该添加到的分类
        const targetCategoryId = currentCategory === 'default' ? 'uncategorized' : currentCategory;
        // 检查目标分类中是否已存在同名笔记
        if (notesData.notes.some(note => note.title.toLowerCase() === noteTitle.toLowerCase() && note.categoryId === targetCategoryId)) {
            alert('目标分类中已存在同名笔记，无法添加！');
            return;
        }
        if (noteTitle) {
            const newNote = {
                id: Date.now().toString(),
                title: noteTitle,
                content: '',
                lastModified: new Date().toISOString(),
                categoryId: targetCategoryId
            };
            notesData.notes.push(newNote);
            localStorage.setItem('notesData', JSON.stringify(notesData));
            displayNotes(currentCategory);
        }
    });

    // 自动保存笔记内容
    noteTitle.addEventListener('input', autoSaveNote);
    noteContent.addEventListener('input', autoSaveNote);

    // 初始渲染分类和笔记
    renderCategories();
    displayNotes('default');

    // 清除 localStorage
    clearStorageButton.addEventListener('click', function() {
        if (confirm('确定要清除所有存储的数据吗？此操作无法撤销。')) {
            localStorage.clear();
            // 重置 notesData
            notesData.categories = [
                { id: 'default', name: '全部笔记' },
                { id: 'uncategorized', name: '未分类' },
                { id: 'recently-deleted', name: '最近删除' }
            ];
            notesData.notes = [
                {
                    id: Date.now().toString(),
                    title: '介绍',
                    content: '1. 实现了笔记分类的功能，用户可以添加新的分类\n2. 用户可以拖拽笔记进行排序\n3. 用户可以将笔记拖拽到左侧的分类中进行分组\n4. 实时渲染markdown基本语法\n5. 有最近删除功能，删除笔记后可以在最近删除中复原\n6. 在最近删除中删除笔记将无法复原笔记\n7. 支持搜索功能，可以搜索笔记标题和内容\n8. 实现了三种主题切换，会根据用户浏览器默认主题进行更换\n9. 笔记分类名不能为空，或者重复\n10. 笔记名不能为空\n11. 笔记名在当前分类下不能重复',
                    lastModified: new Date().toISOString(),
                    categoryId: 'uncategorized'
                }
            ];
            renderCategories();
            displayNotes('default');
        }
    });


    // 移动笔记到新的分类
    function moveNoteToCategory(noteId, newCategoryId) {
        const note = notesData.notes.find(n => n.id === noteId);
        if (note) {
            // 如果目标分类是"最近删除"，记录原始分类
            if (newCategoryId === 'recently-deleted' && !note.originalCategoryId) {
                note.originalCategoryId = note.categoryId;
            }
            if( newCategoryId === 'default')return;

            // 如果目标分类不是"最近删除"，则不检查重复
            if (newCategoryId !== 'recently-deleted') {
                // 检查目标分类中是否存在同名笔记
                const isDuplicate = notesData.notes.some(n => n.title === note.title && n.categoryId === newCategoryId);
                if (isDuplicate) {
                    alert('目标分类中已存在同名笔记，无法移动！');
                    return;
                }
            }
            note.categoryId = newCategoryId;
            note.lastModified = new Date().toISOString(); // 更新最后修改时间
            localStorage.setItem('notesData', JSON.stringify(notesData));
            displayNotes(currentCategory);
        }
    }

    searchInput.addEventListener('input', function() {
        const searchText = searchInput.value.toLowerCase();
        displayNotes(currentCategory, searchText);
    });

    // 拖拽笔记事件
    function dragNote(event) {
        event.dataTransfer.setData("text", event.target.dataset.id);
    }

    // 放下笔记到新位置的事件
    function dropNote(event) {
        event.preventDefault();
        const dragType = event.dataTransfer.getData('type');
        if (dragType !== 'note') return; // 只处理笔记的排序

        const droppedId = event.dataTransfer.getData("text/plain");
        const targetLi = event.target.closest('li');
        if (!targetLi) return;
        const targetId = targetLi.dataset.id;

        if (droppedId !== targetId) {
            const droppedIndex = notesData.notes.findIndex(note => note.id === droppedId);
            const targetIndex = notesData.notes.findIndex(note => note.id === targetId);
            const [removed] = notesData.notes.splice(droppedIndex, 1);
            notesData.notes.splice(targetIndex, 0, removed);

            localStorage.setItem('notesData', JSON.stringify(notesData));
            displayNotes(currentCategory); // 重新渲染笔记列表以反映新的顺序
        }
    }


    // 1. 获取分类列表元素
    const categoryListElement = document.getElementById('category-list');

    // 2. 绑定事件监听器
    // dragover: 必须阻止默认行为，才能允许元素被放置
    categoryListElement.addEventListener('dragover', function(event) {
        event.preventDefault();
    });



    // 绑定事件监听器
    noteList.addEventListener('dragover', function(event) {
        event.preventDefault(); // 必须阻止默认行为才能触发 drop 事件
    });
    noteList.addEventListener('drop', dropNote);
});


document.addEventListener('DOMContentLoaded', function() {
    const lightThemeButton = document.getElementById('light-theme');
    const darkThemeButton = document.getElementById('dark-theme');
    const lightGreenThemeButton = document.getElementById('light-green-theme'); // 新增按钮用于切换浅绿色主题
    const overlay = document.getElementById('transition-overlay');  // 获取过渡动画容器

    // 检测浏览器的主题偏好
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    // 根据系统设置选择主题
    if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-theme');
        darkThemeButton.style.display = 'none'; // 深色模式下，深色按钮隐藏
        lightThemeButton.style.display = 'inline-block'; // 其他钮显示
        lightGreenThemeButton.style.display = 'inline-block';
    } else {
        document.body.classList.add('light-theme');
        lightThemeButton.style.display = 'none'; // 浅色模式下，浅色按钮隐藏
        darkThemeButton.style.display = 'inline-block'; // 其他按钮显示
        lightGreenThemeButton.style.display = 'inline-block';
    }

    // 切换到浅色主题
    lightThemeButton.addEventListener('click', function() {
        document.body.classList.remove('dark-theme', 'light-green-theme');
        document.body.classList.add('light-theme');
        
        // 隐藏当前按钮
        lightThemeButton.style.display = 'none';
        // 示其他按钮
        darkThemeButton.style.display = 'inline-block';
        lightGreenThemeButton.style.display = 'inline-block';
    });

    // 切换到深色主题
    darkThemeButton.addEventListener('click', function() {
        document.body.classList.remove('light-theme', 'light-green-theme');
        document.body.classList.add('dark-theme');
        
        // 隐藏当前按钮
        darkThemeButton.style.display = 'none';
        // 显示其他按钮
        lightThemeButton.style.display = 'inline-block';
        lightGreenThemeButton.style.display = 'inline-block';
    });

    // 切换到浅绿色主题
    lightGreenThemeButton.addEventListener('click', function() {
        document.body.classList.remove('light-theme', 'dark-theme');
        document.body.classList.add('light-green-theme');
        
        // 隐藏当前按钮
        lightGreenThemeButton.style.display = 'none';
        // 显示其他按钮
        lightThemeButton.style.display = 'inline-block';
        darkThemeButton.style.display = 'inline-block';
    });
});


function renderMarkdown(text) {
    // 转换标题
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 转换粗体
    text = text.replace(/\*\*(.*)\*\*/gim, '<b>$1</b>');

    // 转换斜体
    text = text.replace(/\*(.*)\*/gim, '<i>$1</i>');

    // 转换无序列表
    text = text.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');

    // 转换有序列表
    text = text.replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>');

    // 换行
    text = text.replace(/\n$/gim, '<br />');

    return text.trim();
}





