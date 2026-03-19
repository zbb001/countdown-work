// 后台脚本 - 处理标签页间状态同步

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // 折叠状态变化时，广播给所有标签页
  if (request.action === 'collapseStateChanged') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        // 不发送给发起变化的标签页
        if (tab.id !== sender.tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'syncCollapseState',
            collapsed: request.collapsed
          }).catch(() => {
            // 忽略无法发送消息的标签页（如未加载完成的页面）
          });
        }
      });
    });
  }
});
