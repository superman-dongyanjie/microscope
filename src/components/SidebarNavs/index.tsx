import * as React from 'react'
import { Link } from 'react-router-dom'
import { translate } from 'react-i18next'
import Typography from '@material-ui/core/Typography'
import Toolbar from '@material-ui/core/Toolbar'
import Drawer from '@material-ui/core/Drawer'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import IconButton from '@material-ui/core/IconButton'
import MenuIcon from '@material-ui/icons/Menu'
import AppBar from '@material-ui/core/AppBar'

const styles = require('../../containers/Header/styles.scss')

const SidebarNavs = ({ open, containers, pathname, toggleSideNavs, t }) => (
  <Drawer open={open} onClose={toggleSideNavs()}>
    <AppBar position="sticky">
      <Toolbar
        classes={{
          root: styles.toolbarRoot,
        }}
      >
        <Link
          to="/"
          href="/"
          onClick={toggleSideNavs()}
          style={{ color: '#000', marginRight: '31px' }}
        >
          <Typography variant="title" color="inherit">
            {(process.env.APP_NAME as string).toUpperCase()}
          </Typography>
        </Link>
        <IconButton
          aria-label="open drawer"
          onClick={toggleSideNavs()}
          classes={{ root: styles.toggleIcon }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
    <List>
      {containers.filter(container => container.nav).map(container => (
        <ListItem key={container.name}>
          <ListItemText
            primary={
              <Link
                to={container.path}
                href={container.path}
                className={`${styles.navItem} ${
                  pathname === container.path ? styles.activeNav : ''
                }`}
                onClick={toggleSideNavs()}
              >
                <span>{t(container.name)}</span>
              </Link>
            }
          />
        </ListItem>
      ))}
    </List>
  </Drawer>
)
export default translate('microscope')(SidebarNavs)
