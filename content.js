// 当牛做马倒计时 - 内容脚本
(function() {
  'use strict';
  
  let countdownWidget = null;
  let updateInterval = null;
  
  // 嘲讽语录库
  const sarcasticQuotes = [
    '这班是非上不可吗？',
    '又是当牛做马的一天',
    '工资三千五，命比咖啡苦',
    '打工而已，别太认真',
    '老板画的饼，噎死我了',
    '摸鱼是对工资的基本尊重',
    '上班如上坟，下班如重生',
    '我是自愿来打工的（不是）',
    '今天的苦就吃到这里',
    '我的时间很值钱，但老板不觉得',
    '打工人的命也是命啊',
    '再坚持一下，就下班了！',
    '这个班不上也罢（开玩笑的）',
    '每天都在为别人的梦想努力',
    '工资到账的那一刻，一切都值得...吗？'
  ];
  
  // 初始化
  function init() {
    createWidget();
    loadSettingsAndUpdate();
    startAutoUpdate();
    
    // 恢复折叠状态（默认为收起状态）
    chrome.storage.sync.get(['collapsed'], (result) => {
      // 如果没有设置过，默认收起
      const shouldCollapse = result.collapsed !== false;
      if (shouldCollapse) {
        countdownWidget.classList.add('collapsed');
        const toggleBtn = countdownWidget.querySelector('.countdown-toggle');
        if (toggleBtn) toggleBtn.textContent = '+';
        // 保存默认状态
        chrome.storage.sync.set({collapsed: true});
      }
    });
  }
  
  // 创建倒计时组件
  function createWidget() {
    // 如果已存在则移除
    if (countdownWidget) {
      countdownWidget.remove();
    }
    
    countdownWidget = document.createElement('div');
    countdownWidget.id = 'work-countdown-widget';
    const randomQuote = sarcasticQuotes[Math.floor(Math.random() * sarcasticQuotes.length)];
    
    countdownWidget.innerHTML = `
      <div class="countdown-header">
        <span class="countdown-icon">🐮</span>
        <span class="countdown-title">当牛做马倒计时</span>
        <button class="countdown-toggle" title="收起/展开">−</button>
      </div>
      <div class="countdown-body">
        <div class="project-name" id="project-name">加载中...</div>
        <div class="countdown-section">
          <div class="countdown-label">距离脱离苦海</div>
          <div class="countdown-value" id="project-days">--</div>
          <div class="countdown-unit">天</div>
        </div>
        <div class="divider"></div>
        <div class="countdown-section work-section">
          <div class="countdown-label">距离解放还有</div>
          <div class="work-time" id="work-time">--:--:--</div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <div class="progress-text" id="progress-text">0%</div>
        </div>
        <div class="sarcasm-marquee">
          <div class="marquee-content" id="sarcasm-marquee">${randomQuote}</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(countdownWidget);
    
    // 添加折叠功能
    const toggleBtn = countdownWidget.querySelector('.countdown-toggle');
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCollapse();
    });
    
    // 点击收起状态的小图标展开（仅在没有拖拽时触发）
    let dragStartTime = 0;
    countdownWidget.addEventListener('mousedown', () => {
      dragStartTime = Date.now();
    });
    
    countdownWidget.addEventListener('click', (e) => {
      // 如果点击的是toggle按钮，不处理
      if (e.target.classList.contains('countdown-toggle')) return;
      
      // 判断是否为拖拽后的点击（超过200ms认为是拖拽）
      const clickDuration = Date.now() - dragStartTime;
      if (countdownWidget.classList.contains('collapsed') && clickDuration < 200) {
        toggleCollapse();
      }
    });
    
    function toggleCollapse() {
      const newCollapsedState = !countdownWidget.classList.contains('collapsed');
      countdownWidget.classList.toggle('collapsed');
      toggleBtn.textContent = newCollapsedState ? '+' : '−';
      // 保存折叠状态
      chrome.storage.sync.set({collapsed: newCollapsedState});
      // 广播状态变化给所有标签页
      broadcastCollapseState(newCollapsedState);
    }
    
    // 广播折叠状态给其他标签页
    function broadcastCollapseState(collapsed) {
      chrome.runtime.sendMessage({
        action: 'collapseStateChanged',
        collapsed: collapsed
      });
    }
    
    // 添加拖拽功能
    makeDraggable(countdownWidget);
  }
  
  // 加载设置并更新显示
  function loadSettingsAndUpdate() {
    chrome.storage.sync.get(['projectName', 'endDate', 'startTime', 'endTime'], (result) => {
      const settings = {
        projectName: result.projectName || '外包项目',
        endDate: result.endDate,
        startTime: result.startTime || '09:00',
        endTime: result.endTime || '18:00'
      };
      
      updateDisplay(settings);
    });
  }
  
  // 更新显示
  function updateDisplay(settings) {
    if (!countdownWidget) return;
    
    // 更新项目名称（添加自嘲前缀）
    const projectNameEl = countdownWidget.querySelector('#project-name');
    const prefixes = ['💼 ', '📋 ', '🏢 ', '🐂 ', '🐴 '];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    projectNameEl.textContent = prefix + (settings.projectName || '苦逼项目');
    
    // 定期更新跑马灯语录（每10秒）
    const marqueeEl = countdownWidget.querySelector('#sarcasm-marquee');
    if (marqueeEl && Math.random() < 0.1) {
      marqueeEl.textContent = sarcasticQuotes[Math.floor(Math.random() * sarcasticQuotes.length)];
    }
    
    // 计算项目剩余天数
    const projectDaysEl = countdownWidget.querySelector('#project-days');
    if (settings.endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(settings.endDate);
      end.setHours(0, 0, 0, 0);
      
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        projectDaysEl.textContent = '0';
        projectDaysEl.style.color = '#999';
      } else if (diffDays === 0) {
        projectDaysEl.textContent = '今';
        projectDaysEl.style.color = '#ff6b6b';
      } else if (diffDays > 100) {
        projectDaysEl.textContent = diffDays;
        projectDaysEl.style.color = '#ee5a6f'; // 深红色 - 太惨了
      } else {
        projectDaysEl.textContent = diffDays;
        // 根据剩余天数设置颜色
        if (diffDays <= 7) {
          projectDaysEl.style.color = '#ff6b6b'; // 红色 - 即将结束
        } else if (diffDays <= 30) {
          projectDaysEl.style.color = '#feca57'; // 黄色 - 一个月内
        } else {
          projectDaysEl.style.color = '#1dd1a1'; // 绿色 - 还早
        }
      }
    } else {
      projectDaysEl.textContent = '--';
    }
    
    // 计算下班倒计时
    const workTimeEl = countdownWidget.querySelector('#work-time');
    const progressFillEl = countdownWidget.querySelector('#progress-fill');
    const progressTextEl = countdownWidget.querySelector('#progress-text');
    
    const now = new Date();
    const [startHour, startMinute] = settings.startTime.split(':').map(Number);
    const [endHour, endMinute] = settings.endTime.split(':').map(Number);
    
    const startTime = new Date(now);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(now);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // 判断当前状态
    if (now < startTime) {
      // 还没上班
      workTimeEl.textContent = '还没开始';
      workTimeEl.style.color = '#74b9ff';
      progressFillEl.style.width = '0%';
      progressTextEl.textContent = '0% - 珍惜最后自由时光';
    } else if (now >= endTime) {
      // 已经下班
      workTimeEl.textContent = '终于解放';
      workTimeEl.style.color = '#1dd1a1';
      progressFillEl.style.width = '100%';
      progressTextEl.textContent = '100% - 快跑！';
    } else {
      // 上班中
      const remainingMs = endTime - now;
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
      
      workTimeEl.textContent = 
        `${String(remainingHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
      workTimeEl.style.color = '#ff9f43';
      
      // 计算进度
      const totalWorkMs = endTime - startTime;
      const elapsedMs = now - startTime;
      const progress = Math.min(100, Math.max(0, (elapsedMs / totalWorkMs) * 100));
      
      progressFillEl.style.width = `${progress}%`;
      
      // 根据进度显示不同的自嘲文案
      let progressMsg = '';
      if (progress < 20) {
        progressMsg = ' - 煎熬刚开始';
      } else if (progress < 40) {
        progressMsg = ' - 才这点进度？';
      } else if (progress < 60) {
        progressMsg = ' - 过半了！撑住！';
      } else if (progress < 80) {
        progressMsg = ' - 胜利在望';
      } else {
        progressMsg = ' - 最后冲刺！';
      }
      progressTextEl.textContent = `${Math.round(progress)}%${progressMsg}`;
      
      // 根据进度设置颜色
      if (progress < 30) {
        progressFillEl.style.background = 'linear-gradient(90deg, #1dd1a1, #10ac84)';
      } else if (progress < 70) {
        progressFillEl.style.background = 'linear-gradient(90deg, #feca57, #ff9f43)';
      } else {
        progressFillEl.style.background = 'linear-gradient(90deg, #ff6b6b, #ee5a6f)';
      }
    }
  }
  
  // 开始自动更新
  function startAutoUpdate() {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    
    // 每秒更新一次
    updateInterval = setInterval(() => {
      loadSettingsAndUpdate();
    }, 1000);
  }
  
  // 拖拽功能
  function makeDraggable(element) {
    const header = element.querySelector('.countdown-header');
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = element.offsetLeft;
      initialY = element.offsetTop;
      element.style.transition = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      element.style.left = `${initialX + dx}px`;
      element.style.top = `${initialY + dy}px`;
      element.style.right = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        element.style.transition = 'all 0.3s ease';
      }
    });
  }
  
  // 监听设置更新消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'settingsUpdated') {
      loadSettingsAndUpdate();
    }
    // 监听折叠状态同步
    if (request.action === 'syncCollapseState') {
      const toggleBtn = countdownWidget.querySelector('.countdown-toggle');
      if (request.collapsed) {
        countdownWidget.classList.add('collapsed');
        if (toggleBtn) toggleBtn.textContent = '+';
      } else {
        countdownWidget.classList.remove('collapsed');
        if (toggleBtn) toggleBtn.textContent = '−';
      }
      // 保存状态
      chrome.storage.sync.set({collapsed: request.collapsed});
    }
  });
  
  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
