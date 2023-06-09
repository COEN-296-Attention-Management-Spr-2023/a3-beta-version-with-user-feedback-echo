import React from 'react'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import {
  Drawer,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Home as HomeIcon,
  IndeterminateCheckBox as TodoIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material/'
import { useTodoCount } from '@app/Store/Slices/Remindoros'

import { Screens } from '@app/Routes/'

type Props = {
  isMenuOpen: boolean
  setMenuStatus: React.Dispatch<React.SetStateAction<boolean>>
}

const DrawerHolder = styled.div`
  background: ${props => props.theme.background};
  color: white;
  width: 250px;
  height: 100%;
`

const Link = styled(NavLink)`
  display: flex;
  text-decoration: none;
  color: ${props => props.theme.textColor};
  margin: 2px 0;

  &:hover {
    background: ${props => props.theme.borderDark};
  }

  &.selected-screen {
    background: ${props => props.theme.primaryDark};
  }

  & .listIcon {
    color: ${props => props.theme.highlight};
  }
`

function TodoMenu() {
  const count = useTodoCount()
  return (
    <ListItemButton>
      <ListItemIcon className={'listIcon'}>{<TodoIcon />}</ListItemIcon>
      <ListItemText primary={`Todo ${count > 0 ? `(${count})` : ''}`} />
    </ListItemButton>
  )
}

function Sidebar({ isMenuOpen, setMenuStatus }: Props) {
  return (
    <Drawer
      anchor={'left'}
      open={isMenuOpen}
      onClose={() => setMenuStatus(false)}
    >
      <DrawerHolder
        role="presentation"
        onClick={() => setMenuStatus(false)}
        onKeyDown={() => setMenuStatus(false)}
      >
        <List>
          {/* Home Menu */}
          <Link to={Screens.Home} exact activeClassName={'selected-screen'}>
            <ListItemButton>
              <ListItemIcon className={'listIcon'}>{<HomeIcon />}</ListItemIcon>
              <ListItemText primary={'Home'} />
            </ListItemButton>
          </Link>

          {/* Todo Menu */}
          <Link to={Screens.Todo} exact activeClassName={'selected-screen'}>
            <TodoMenu />
          </Link>

          {/* Scheduled Menu */}
          <Link
            to={Screens.Scheduled}
            exact
            activeClassName={'selected-screen'}
          >
            <ListItemButton>
              <ListItemIcon className={'listIcon'}>
                {<EventIcon />}
              </ListItemIcon>
              <ListItemText primary={'Scheduled'} />
            </ListItemButton>
          </Link>

          {/* Settings Menu */}
          <Link to={Screens.Settings} exact activeClassName={'selected-screen'}>
            <ListItemButton>
              <ListItemIcon className={'listIcon'}>
                {<SettingsIcon />}
              </ListItemIcon>
              <ListItemText primary={'Settings'} />
            </ListItemButton>
          </Link>
        </List>
        <Divider
          sx={{
            background: theme => theme.colors.primaryDark,
          }}
        />
        <List>
          <Link to={Screens.Focus} exact activeClassName={'selected-screen'}>
            <ListItemButton>
              <ListItemText primary={'Focus Mode'} />
            </ListItemButton>
          </Link>
        </List>
      </DrawerHolder>
    </Drawer>
  )
}

export default Sidebar
