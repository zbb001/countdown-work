// 当牛做马倒计时 - 初始化
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updatePreview();
});

// 监听输入变化，实时更新预览
document.getElementById('endDate').addEventListener('change', updatePreview);

// 保存按钮点击事件
document.getElementById('saveBtn').addEventListener('click', saveSettings);

// 加载设置
function loadSettings() {
  chrome.storage.sync.get(['projectName', 'endDate', 'startTime', 'endTime'], (result) => {
    if (result.projectName) {
      document.getElementById('projectName').value = result.projectName;
    }
    if (result.endDate) {
      document.getElementById('endDate').value = result.endDate;
    }
    if (result.startTime) {
      document.getElementById('startTime').value = result.startTime;
    }
    if (result.endTime) {
      document.getElementById('endTime').value = result.endTime;
    }
  });
}

// 保存设置
function saveSettings() {
  const settings = {
    projectName: document.getElementById('projectName').value || '苦逼项目',
    endDate: document.getElementById('endDate').value,
    startTime: document.getElementById('startTime').value || '09:00',
    endTime: document.getElementById('endTime').value || '18:00'
  };
  
  chrome.storage.sync.set(settings, () => {
    // 显示保存成功提示
    const status = document.getElementById('status');
    status.classList.add('show');
    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
    
    // 通知内容脚本更新
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {action: 'settingsUpdated'}).catch(() => {});
      });
    });
  });
}

// 更新预览
function updatePreview() {
  const endDate = document.getElementById('endDate').value;
  if (!endDate) {
    document.getElementById('previewDays').textContent = '-- 天';
    return;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    document.getElementById('previewDays').textContent = '已经自由了！';
  } else if (diffDays === 0) {
    document.getElementById('previewDays').textContent = '今天解放！';
  } else if (diffDays > 100) {
    document.getElementById('previewDays').textContent = `${diffDays} 天 😭`;
  } else {
    document.getElementById('previewDays').textContent = `${diffDays} 天`;
  }
}
