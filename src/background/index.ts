import browser from 'webextension-polyfill'

import type { RootState } from '@app/Store/'

import { ALARM_KEY, STORAGE_KEY, ContextMenuKeys } from '@app/Constants'
import { migrate_v0_data_to_v1, getTodoCount, setBadgeText } from './utils/'
import { notify, Notification } from './utils/notification'
import { handle_context_menu } from './utils/context-menu'
// import { useSelector } from 'react-redux'

export const WHATS_NEW = ['Todo Notes ✅', 'Rich Text Editor Improvements']
export const WHATS_UP = ['Folder Support', 'Sync Support']

/*
 * ref: https://github.com/mozilla/webextension-polyfill
 */

/*
 * Install Events
 */

// const site_list = [
//   'facebook.com',
//   'youtube.com',
//   'twitter.com',
//   'reddit.com',
//   'hulu.com',
//   'www.facebook.com',
//   'www.youtube.com',
//   'www.twitter.com',
//   'www.reddit.com',
//   'www.hulu.com',
// ]

browser.runtime.onInstalled.addListener(initialize_install_events)

function initialize_install_events(
  details: browser.Runtime.OnInstalledDetailsType
) {
  // ref: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onInstalled
  // ref: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/OnInstalledReason
  // run only if extension is installed or updated
  const BROWSER_UPDATE_REASONS = ['browser_update', 'chrome_update']
  if (BROWSER_UPDATE_REASONS.includes(details.reason)) {
    // do not run init events
    return
  }

  console.log('initing install events ')
  // migrating v0.x => v1.x data
  // mostly harmless migration - removing unwanted keys
  // we don't have to wait for migration - fire and forget!!!
  // also we will not repeatedly migrate if we are already in v1.x
  // we will be checking for 'version' key which is present in v.1.x
  migrate_v0_data_to_v1()

  // welcome message
  const welcome_message = {
    id: 'welcome-message',
    title: `Web Task Reminder`,
    note: ` Welcome `,
  }

  notify(welcome_message)
}

/*
 * Init Background tasks
 *
 * Important: this file is called only once during initial load
 * repeated tasks are set via timer/alarm setup
 * It is important to fetch fresh data from local storage inside
 * alarm callbacks like 'browser.alarms.onAlarm.addListener'
 * passing data via arguments to the parent function will result in
 * stale closure and will lead to browser storage bugs
 *
 * init_extension_events() - called once, sets up alarm which is called every minute. The callback for alarm listener is called every minute and this needs to have fresh data
 * init_context_menus - called once
 */

init_extension_events()
init_context_menus()

async function getLocalStorageData() {
  const data = await browser.storage.local.get(STORAGE_KEY)

  return data[STORAGE_KEY] as RootState
}

function init_extension_events() {
  show_alarms()
  show_todo_badge()
  block()
}

/*
 * Show Todo Badge
 */
async function show_todo_badge() {
  try {
    const remindoroData = await getLocalStorageData()
    const remindoros = remindoroData.remindoros

    const status = getTodoCount(remindoros)
    const text = status >= 1 ? `${status}` : ''
    setBadgeText(text)
  } catch (e) {
    // probably error fetching local storage data
  }
}

/*
 * Show alarms
 */

function show_alarms() {
  // CREATE an alarm
  browser.alarms.create(ALARM_KEY, {
    delayInMinutes: 0.1,
    periodInMinutes: 1,
  })

  // listen for the alarm
  // and dig the remindoros from local chrome extension storage and check if we need to show any notifications
  // IMPORTANT: fetch data FRESH from the local storage on alarm callback
  // passing data as argument will result in stale closure and will reset the data to initial data
  // when the browser was opened!!!
  browser.alarms.onAlarm.addListener(async alarmInfo => {
    // let us make sure we are listening for right alarm
    if (alarmInfo.name !== ALARM_KEY) {
      // do not proceed
      return
    }

    // here we can handle alarm
    try {
      const remindoroData = await getLocalStorageData()

      let showNotification: boolean | undefined =
        remindoroData.settings.notificationsEnabled

      // edge case: if we don't have the config defined by default we will show notification
      if (showNotification === undefined) {
        showNotification = true
      }

      // handle notifications
      const notification = new Notification(
        remindoroData.remindoros,
        showNotification
      )
      const updatedRemindoros = notification.scan()
      // let us notify
      notification.notify()
      // and update stuffs to store
      // IMPORTANT: we are not emitting event to the open popup
      // to indicate that remindoro time are updated in background
      // for now, we are allowing people to focus in the open popup
      notification.updateStore(updatedRemindoros)
    } catch (e) {
      // some error fetching remindoro data
    }
  })
}

function block() {
  browser.tabs.onActivated.addListener(async activeInfo => {
    try {
      const remindoroData = await getLocalStorageData()
      const remindoros = remindoroData.remindoros
      //     const remindoro: Maybe<Remindoro> = useSelector((remindoros : RootState) =>
      //     state.remindoros.find(ro => String(ro.myurl) === remindoroId)
      // )
      console.log(remindoros)
      const blockedRemindoros = remindoros.filter(
        remindoro => remindoro.isToBlock
      )
      // Log the blocked remindoros
      console.log(blockedRemindoros)
      let showFocus: boolean | undefined = remindoroData.settings.focusEnabled
      if (showFocus === undefined) {
        showFocus = false
      }

      if (showFocus == true) {
        let queryOptions = { active: true, lastFocusedWindow: true }
        let [tab] = await browser.tabs.query(queryOptions) //const name: string = tab.url as string
        if (blockedRemindoros.some(el => tab.url?.includes(el.myurl))) {
          // tab.url?.includes('youtube.com/')
          console.log(activeInfo.tabId)
          console.log(tab.id)
          await browser.scripting.executeScript({
            target: { tabId: activeInfo.tabId },
            files: ['content.js'],
          })
          console.log(tab.url)
        }
      }
    } catch (e) {
      //some err
    }
  })
}
/*
 * Init context menus
 */

browser.contextMenus.onClicked.addListener(handle_context_menu)

function init_context_menus() {
  // creating a page context menu
  // POLYFILL/PROMISES not supported
  browser.contextMenus.create(
    {
      id: ContextMenuKeys.SAVE_LINK,
      contexts: ['page', 'link'],
      title: 'Add to tasks',
    },
    () => {
      console.log('context menu created for "Add to Page" ')
    }
  )

  // creating a highlight context menu
  browser.contextMenus.create(
    {
      id: ContextMenuKeys.SAVE_HIGHLIGHT,
      contexts: ['selection'],
      title: 'Save Text',
    },
    () => {
      console.log('context menu created for "Save Text" ')
    }
  )

  browser.contextMenus.create(
    {
      id: ContextMenuKeys.BLOCK_LINK,
      contexts: ['page', 'link'],
      title: 'Block link',
    },
    () => {
      console.log('context menu created for "Block link" ')
    }
  )
}
