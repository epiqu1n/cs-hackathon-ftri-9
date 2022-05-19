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
const closedTabURLs = [];
const two = 2;



chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg);
  switch (msg.type) {
  case 'get-closed-tabs': {
    sendResponse(closedTabURLs);
    break;
  }
  }
});

const currentURLs = new Set();

let activeTabId;

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
  // Set current tab as currently active tab
  activeTabId = tab.id;

/*   // Check if there is already a current tab which matches the URL of the current tab
  chrome.tabs.get(tabInfo.id, (newTab) => {
    if (currentURLs.has(newTab.url)) {
      chrome.notifications.create(null, {
        message: 'You already have this tab open!'
      });
      console.log('You already have this tab open!');
    }
    else currentURLs.add(newTab.url);
  }); */
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  // If a previous tab was open, set last active time of that tab
  if (activeTabId) {
    tabData[activeTabId].lastActive = new Date();
  }
  if (!tabData[tabId]) {
    const tab = await chrome.tabs.get(tabId);
    tabData[tabId] = {
      lastActive: new Date(),
      url: tab.url,
      tabId: tabId
    };
    console.log('Untracked tab activated:', tabData[tabId]);
  }
  else console.log('Tab activated:', tabData[tabId]);
  activeTabId = tabId;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Update URL of updated tab
  tabData[tabId].url = tab.url;
  console.log('Tab updated:', tabData[tabId]);
});

setInterval(checkTabs, 1000);
const MAX_TAB_AGE = 3000;

function checkTabs() {
  // Iterate over all tabs
  // If tab age is over 10 seconds and URL is YouTube, close and push to closed tabs
  for (const tabId in tabData) {
    const tab = tabData[tabId];
    if (parseInt(tabId) !== activeTabId && Date.now() - tab.lastActive > MAX_TAB_AGE && tab.url?.match(/youtube/)) {
      closeTab(tabId);

      // TODO: Push closed tab update to popup if popup is open
    }
  }
}

/**
 * Closes a tab. Defaults to active tab if no tab is provided
 * @param {TabData} tab 
 */
function closeTab(tab = null) {
  if (!tab) tab = tabData[activeTabId];

  console.log('Closing tab:', tab);
  closedTabURLs.push(tab.url);
  chrome.tabs.remove(tab.tabId);
  delete tabData[tab.tabId];
}