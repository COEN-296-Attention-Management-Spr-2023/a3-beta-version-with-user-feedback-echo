import { v4 as uuid } from 'uuid'

import type { Menus, Tabs } from 'webextension-polyfill'

import { RemindoroLevelType, RemindoroType } from '@app/Store/Slices/Remindoros'
import { ContextMenuKeys } from '@app/Constants'
import { notify } from './notification'
import { loadFromStorage, syncToStorage } from '@app/Util/BrowserStorage'

export function handle_context_menu(
  menu_details: Menus.OnClickData,
  tab_details: Tabs.Tab | undefined
) {
  // we will be handling two types of context menus
  // page/link action => adding the page url as note, title as title
  // highlighted action => title - url as title, highlighted text as body
  const context_id = menu_details.menuItemId
  const save_link_action = context_id === ContextMenuKeys.SAVE_LINK
  const highlight_action = context_id === ContextMenuKeys.SAVE_HIGHLIGHT
  const block_link_action = context_id === ContextMenuKeys.BLOCK_LINK

  const title = tab_details?.title
  const url = tab_details?.url

  if (save_link_action) {
    save_link({
      title,
      url,
    })
    // do not proceed
    return
  }

  if (highlight_action) {
    const highlight = menu_details.selectionText
    save_highlight({
      title,
      url,
      highlight,
    })
    // do not proceed
    return
  }

  if (block_link_action) {
    block_link({
      title,
      url,
    })
    return
  }

  return
}

interface ContextAction {
  title?: string
  url?: string
  myurl?: string
  mytype?: RemindoroLevelType
  isToBlock?: boolean
}

interface HighlightAction extends ContextAction {
  highlight?: string
}

interface BlockAction extends ContextAction {}

// save new link to remindoro
function save_link({ title, url, myurl, mytype }: ContextAction) {
  const newRemindoro = {
    id: uuid(),
    title: title || `${url}`,
    // markdown note
    note: `
[${url}](${url})
    `,
    myurl: myurl || '',
    mytype: mytype || RemindoroLevelType.LEVEL1,
    type: RemindoroType.Note,
    isToBlock: false,
    created: Date.now(),
    updated: Date.now(),
  }

  // we have to save this new remindoro to store
  loadFromStorage({
    onSuccess: currentData => {
      const updatedData = {
        ...currentData,
        remindoros: [...currentData.remindoros, newRemindoro],
      }
      // we have to sync the updated data
      syncToStorage({
        currentState: updatedData,
        onSuccess: () => {
          // we have to notify a new link is saved
          notify({
            id: 'new-link-saved',
            title: 'Link Saved',
            note: `${url} saved successfully`,
          })
        },
        // not able to save the link
        onError: () => {},
      })
    },
    // not able to save the link
    onError: () => {},
  })
}

// save selection/highlight to remindoro
function save_highlight({
  title,
  url,
  highlight,
  myurl,
  mytype,
}: HighlightAction) {
  const newRemindoro = {
    id: uuid(),
    title: title || `${url}`,
    // markdown note
    note: `
>${highlight}

[${url}](${url})
    `,
    myurl: myurl || '',
    mytype: mytype || RemindoroLevelType.LEVEL1,
    type: RemindoroType.Note,
    isToBlock: false,
    created: Date.now(),
    updated: Date.now(),
  }

  // we have to save this new remindoro to store
  loadFromStorage({
    onSuccess: currentData => {
      const updatedData = {
        ...currentData,
        remindoros: [...currentData.remindoros, newRemindoro],
      }
      // we have to sync the updated data
      syncToStorage({
        currentState: updatedData,
        onSuccess: () => {
          // we have to notify a new link is saved
          notify({
            id: 'new-highlight-saved',
            title: 'Text Saved',
            note: `saved successfully`,
          })
        },
        // not able to save the link
        onError: () => {},
      })
    },
    // not able to save the link
    onError: () => {},
  })
}
function block_link({ title, url, myurl, mytype }: BlockAction) {
  const newBlock = {
    id: uuid(),
    title: title || `${url}`,
    // markdown note
    note: `
[To Block](${url})
    `,
    myurl: myurl || `${url}`,
    mytype: mytype || RemindoroLevelType.LEVEL1,
    type: RemindoroType.Note,
    isToBlock: true,
    created: Date.now(),
    updated: Date.now(),
  }

  // we have to save this new remindoro to store
  loadFromStorage({
    onSuccess: currentData => {
      const updatedData = {
        ...currentData,
        remindoros: [...currentData.remindoros, newBlock],
      }
      // we have to sync the updated data
      syncToStorage({
        currentState: updatedData,
        onSuccess: () => {
          // we have to notify a new link is saved
          notify({
            id: 'new-link-toblock',
            title: 'Link blocked',
            note: `${url} to block saved successfully`,
          })
        },
        // not able to save the link
        onError: () => {},
      })
    },
    // not able to save the link
    onError: () => {},
  })
}
