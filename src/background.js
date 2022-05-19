/**
 * @typedef TabData
 * @prop {Date} lastActive
 * @prop {string} url
 * @prop {number} tabId
 */

/**
 * @type {{[tabId: number]: TabData}}
 */
const tabData = {};
/** @type {string[]} */ const closedTabURLs = [];
/** @type {number}   */ let activeTabId;

const MAX_TAB_AGE = 3000; // In milliseconds

// Initialze enabled state from chrome storage
let isOn = false;
chrome.storage.sync.get('isEnabled', (result) => {
  console.log('Reading storage:', result);
  isOn = result.isEnabled;
});

/** Check and store info about all existing tabs on extension load */
chrome.tabs.query({}, (tabs) => {
  for (const tab of tabs) {
    tabData[tab.id] = {
      lastActive: new Date(),
      tabId: tab.id,
      url: tab.url
    }
  }
});

/** Message listener for messages from popup.js */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg);
  switch (msg.type) {
    case 'get-closed-tabs': {
      // Request for all closed tabs
      sendResponse(closedTabURLs);
      break;
    }
    case 'cleanup-tab': {
      cleanupTab();
      break;
    }
    case 'toggle-on-off': {
      isOn = msg.isOn;
      chrome.storage.sync.set({ isEnabled: msg.isOn });
      break;
    }
  }
});

/** Updates tabData when a new tab is created */ 
chrome.tabs.onCreated.addListener((tab) => {
  // When a new tab is created, store tab id with timestamp and URL
  // If a previous tab was open, set last active time of that tab
  if (activeTabId) tabData[activeTabId].lastActive = new Date();
  tabData[tab.id] = {
    lastActive: new Date(),
    url: tab.url,
    tabId: tab.id
  };
  console.log('Tab created:', tabData[tab.id]);

/* 
  // Check if there is already a current tab which matches the URL of the current tab
  chrome.tabs.get(tabInfo.id, (newTab) => {
    if (currentURLs.has(newTab.url)) {
      chrome.notifications.create(null, {
        message: 'You already have this tab open!'
      });
      console.log('You already have this tab open!');
    }
    else currentURLs.add(newTab.url);
  }); 
*/
});

/** Updates tabData when a tab is activated */
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  if (activeTabId) {
    // If there was a previously active tab, set last active time of that tab
    tabData[activeTabId].lastActive = new Date();
  }
  if (!tabData[tabId]) {
    // If activated tab has not been tracked yet, add to tabData
    const tab = await chrome.tabs.get(tabId);
    tabData[tabId] = {
      lastActive: new Date(),
      url: tab.url,
      tabId: tabId
    };
    console.log('Untracked tab activated:', tabData[tabId]);
  }
  else console.log('Tab activated:', tabData[tabId]);

  // Set activated tab as currently active tab
  activeTabId = tabId;
});

/** Updates tabData when a tab is updated */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Update URL of updated tab
  tabData[tabId].url = tab.url;
  console.log('Tab updated:', tabData[tabId]);
});

/** Updates tabData when a tab is removed */
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabData[tabId]) {
    delete tabData[tabId];
    console.log('Tab removed:', tabData[tabId]);
  }
  else console.log('Untracked tab removed:', tabId);

  if (tabId === activeTabId) activeTabId = null;
});

/**
 * Checks tracked tabs and closes any that are over `MAX_TAB_AGE` old.  
 * Currently only works for YouTube tabs for debugging purposes
 */
function checkTabs() {
  // Iterate over all tabs
    // If tab age is over `MAX_TAB_AGE` and URL is YouTube, close and push to closed tabs
  for (const __tabIdStr in tabData) {
    const tabId = parseInt(__tabIdStr);
    const tab = tabData[tabId];
    if (tabId !== activeTabId && Date.now() - tab.lastActive > MAX_TAB_AGE && tab.url?.match(/(youtube)|(stackoverflow)|(reddit)/)) {
      if (isOn) cleanupTab(tab);

      // TODO: Push closed tab update to popup if popup is open
    }
  }
}
// Check tabs once every second
setInterval(checkTabs, 1000);

/**
 * Closes a tab and stores the URL. Defaults to active tab if no tab is provided
 * @param {TabData} tab 
 */
function cleanupTab(tab = null) {
  if (!tab) tab = tabData[activeTabId];
  // TODO: If extension is toggled off, do not close

  console.log('Closing tab:', tab);
  closedTabURLs.push(tab.url);
  chrome.tabs.remove(tab.tabId);
  delete tabData[tab.tabId];
}