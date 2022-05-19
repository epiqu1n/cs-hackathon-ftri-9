const closedTabsEl = document.querySelector('#closedTabs');

window.onload = () => {
  console.log('Tab Janitor popup opened');
  chrome.runtime.sendMessage({
    type: 'get-closed-tabs'
  }, (response) => {
    if (response?.length === 0) return;
    closedTabsEl.innerHTML = response.map((url) => `<a href="${url}" target="blank">${url}</a>`).join('<br/>');
  });
}
/* chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  oneEl.innerText = req.value;
}) */