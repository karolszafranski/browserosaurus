import electron from 'electron'
import opn from 'opn'
import Mousetrap from 'mousetrap'

class PickerWindow {
  constructor() {
    this.url = null
    this.window = electron.remote.getCurrentWindow()
    this.urlField = document.getElementById('url')
    this.browserList = document.getElementById('browserList')

    /**
     * Event: Listen for URL
     * Update URL global var and show window
     */
    electron.ipcRenderer.on('incomingURL', (event, incomingURL) => {
      this.urlField.innerText = incomingURL
      this.url = incomingURL
      this.window.show()
    })

    /**
     * Event: Update browsers
     * Re/populate browser list
     */
    electron.ipcRenderer.on('incomingBrowsers', (event, browsers) => {
      this.emptiesPicker()
      this.populatePicker(browsers)
    })

    /**
     * Event: Close window i.e. on blur, escape etc.
     * Hide picker window
     */
    electron.ipcRenderer.on('close', () => {
      this.hideWindow()
    })

    /**
     * Event: Escape key
     * Hide picker window
     */
    Mousetrap.bind('esc', () => {
      this.hideWindow()
    })
  }

  /**
   * Hide Window
   * Hides the window, resetting the URL text and global var
   */
  hideWindow() {
    // remove url from field
    this.urlField.innerText = ''
    setTimeout(() => {
      // if not paused, escape causes an audible error (beep). Presumably there's some sort of race condition here. Anyway, the timeout seems to solve it.
      this.window.hide()
      this.url = null
    }, 0)
  }

  /**
   * Open Browser
   * Sends the URL to the chosen browser and tells OS to open it.
   * @param {String} appName name of browser as recognised by macOS
   */
  openBrowser(appName) {
    opn(this.url, { app: appName, wait: false })
      .then(() => this.hideWindow())
      .catch(() => {
        alert(
          `Oh no! An error just occurred, please report this as a  GitHub issue. Opened URL was ${
            this.url
          }`
        )
        this.hideWindow()
      })
  }

  /**
   * Empties Picker
   * Clears the picker window of all browsers, readying it to be repopulated.
   */
  emptiesPicker() {
    while (this.browserList.firstChild) {
      this.browserList.removeChild(this.browserList.firstChild)
    }
  }

  /**
   * Populate picker
   * Injects all present and enabled browsers as list items of picker.
   * @param {Array} browsers
   */
  populatePicker(browsers) {
    if (browsers.length > 0) {
      // Populate installedBrowsers

      this.window.setSize(
        400,
        browsers.filter(browser => browser.enabled).length * 64 + 48
      )

      browsers
        .filter(browser => browser.enabled)
        .map(browser => {
          // use alias as label if available, otherwise use name
          if (!browser.alias) {
            browser.alias = browser.name
          }
          return browser
        })
        .map(browser => {
          const listItem = document.createElement('li')

          const browserLogo = document.createElement('img')
          browserLogo.classList.add('browserLogo')
          browserLogo.src = `images/browser-logos/${browser.name}.png`
          listItem.appendChild(browserLogo)

          const browserName = document.createElement('span')
          browserName.classList.add('browserName')
          browserName.innerText = browser.alias
          listItem.appendChild(browserName)

          const browserKey = document.createElement('span')
          browserKey.classList.add('browserKey')
          browserKey.innerText = browser.key
          listItem.appendChild(browserKey)

          listItem.addEventListener('click', () => {
            listItem.classList.remove('active')
            this.openBrowser(browser.name)
          })
          listItem.addEventListener('mouseenter', () => {
            listItem.classList.add('active')
          })
          listItem.addEventListener('mouseleave', () => {
            listItem.classList.remove('active')
          })

          this.browserList.appendChild(listItem)

          Mousetrap.bind(browser.key, () => {
            listItem.classList.add('active')
            setTimeout(() => {
              listItem.classList.remove('active')
              this.openBrowser(browser.name)
            }, 200)
          })
        })
    } else {
      const listItem = document.createElement('li')

      listItem.innerText = 'Loading...'

      this.browserList.appendChild(listItem)
      this.window.setSize(400, 64 + 48)
    }
  }
}

new PickerWindow()
