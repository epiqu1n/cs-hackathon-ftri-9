const closedTabsEl = document.querySelector('#closedTabs');

window.onload = () => {
  console.log('Tab Janitor popup opened');

  // Send request to background.js to get closed tabs and update popup
  chrome.runtime.sendMessage({ type: 'get-closed-tabs' }, updateClosedTabs);

  // Initialize enabled toggle from local storage and sync with background script
  const isEnabled = (localStorage.getItem('isEnabled') === 'false' ? false : true);
  document.querySelector('#enabledButton').checked = isEnabled;
  chrome.runtime.sendMessage({
    type: 'toggle-on-off',
    isOn: isEnabled
  });
}

/**
 * Transforms input array into links and updates the popup with those links
 * @param {string[]} closedTabs 
 */
function updateClosedTabs(closedTabs) {
  if (closedTabs?.length === 0) return;
  closedTabsEl.innerHTML = closedTabs.reverse().map((url) => `<a href="${url}" target="blank">${url}</a>`).join('');
}

/**
 * Closes a tab and stores the URL
 */
function cleanupTab() {
  console.log('Cleaning up current tab');
  chrome.runtime.sendMessage({ type: 'cleanup-tab' });
}
document.querySelector('#cleanButton').addEventListener('click', cleanupTab);

/**
 * Toggles the enabled state of the extension and syncs with background script
 * @param {Event} e 
 */
function toggle(e) {
  chrome.runtime.sendMessage({
    type: 'toggle-on-off',
    isOn: e.target.checked,
  });
  localStorage.setItem('isEnabled', e.target.checked);
}
  
document.querySelector('.toggle').addEventListener('click', toggle);