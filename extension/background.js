chrome.action.onClicked.addListener(async tab => {
  if (!Number.isInteger(tab.id)) return;
  try {
    if (!/^https?:\/\//i.test(tab.url || '')) throw new Error('Unsupported page');
    await chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['reader.bundle.js']});
    await chrome.action.setBadgeText({tabId: tab.id, text: ''});
    await chrome.action.setTitle({tabId: tab.id, title: 'Open or close Working Access reading view'});
  } catch {
    await chrome.action.setBadgeText({tabId: tab.id, text: '!'});
    await chrome.action.setTitle({tabId: tab.id, title: 'Reading view is unavailable here. Try a regular webpage, not a browser page, PDF viewer, or extension store.'});
  }
});
