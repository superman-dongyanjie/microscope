import * as React from 'react'
import { createPortal } from 'react-dom'
import { translate } from 'react-i18next'
import { Subject, Subscription } from '@reactivex/rxjs'
import axios, { AxiosResponse, AxiosPromise } from 'axios'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import TranslateIcon from '@material-ui/icons/Translate'
import MenuIcon from '@material-ui/icons/Menu'
import CloseIcon from '@material-ui/icons/Close'
import FingerprintIcon from '@material-ui/icons/Fingerprint'
import SettingsIcon from '@material-ui/icons/Settings'
import ViewCarouselIcon from '@material-ui/icons/ViewCarousel'
import FormatShapesIcon from '@material-ui/icons/FormatShapes'
import GraphicIcon from '@material-ui/icons/GraphicEq'
import SearchIcon from '@material-ui/icons/Search'
import { containers } from '../../Routes'
import HeaderNavs from '../../components/HeaderNavs'
import SidebarNavs from '../../components/SidebarNavs'
import { IContainerProps, IBlock, Metadata } from '../../typings'
import RightSidebar from '../../components/RightSidebar'
import MetadataPanel from '../../components/MetadataPanel'
import BriefStatisticsPanel from '../../components/BriefStatistics'
import SearchPanel from '../../components/SearchPanel'
import { withConfig } from '../../contexts/config'
import { withObservables } from '../../contexts/observables'
import { isIp } from '../../utils/validators'
import { fetchStatistics } from '../../utils/fetcher'
import { initBlock, initMetadata } from '../../initValues'

const styles = require('./styles')
const layout = require('../../styles/layout')

const icons = {
  Possession: <FingerprintIcon />,
  Blocks: <ViewCarouselIcon />,
  ContractEditor: <FormatShapesIcon />,
  Config: <SettingsIcon />,
  Graphs: <GraphicIcon />,
}
const initState = {
  keyword: '',
  metadata: initMetadata,
  sidebarNavs: false,
  activePanel: '',
  searchIp: '',
  otherMetadata: initMetadata,
  tps: 0,
  tpb: 0,
  ipb: 0,
  peerCount: 0,
  block: initBlock,
  anchorEl: undefined,
  lngOpen: false,
  lng: window.localStorage.getItem('i18nextLng'),
}
type HeaderState = typeof initState
interface HeaderProps extends IContainerProps {}

class Header extends React.Component<HeaderProps, HeaderState> {
  state = initState
  componentWillMount () {
    this.onSearch$ = new Subject()
    this.fetchStatus()
  }
  componentDidMount () {
    // console.log(this.props)

    this.searchSubscription = this.onSearch$
      .debounceTime(1000)
      .subscribe(({ key, value }) => {
        if (key === 'searchIp') {
          this.getChainMetadata(value)
        }
      })
    this.props.CITAObservables.metaData({
      blockNumber: 'latest',
    }).subscribe(
      (metadata: Metadata) => {
        this.setState({
          metadata: {
            ...metadata,
            genesisTimestamp: new Date(
              metadata.genesisTimestamp,
            ).toLocaleString(),
          },
        })
      },
      error => {
        console.error(error)
      },
    )
  }
  componentWillReceiveProps (nextProps: HeaderProps) {
    if (this.props.location.pathname !== nextProps.location.pathname) {
      this.togglePanel('')()
    }
  }
  private onSearch$: Subject<any>
  private getChainMetadata = ip => {
    if (isIp(ip)) {
      axios
        .post(`http://${ip}`, {
          jsonrpc: '2.0',
          method: 'cita_getMetaData',
          params: ['latest'],
          id: 1,
        })
        .then((res: AxiosResponse) => {
          if (res.data && res.data.result) {
            this.setState({
              otherMetadata: {
                ...res.data.result,
                genesisTimestamp: new Date(
                  res.data.result.genesisTimestamp,
                ).toLocaleString(),
              },
            })
          } else {
            throw new Error('Error Response')
          }
        })
        .catch(err => {
          // TODO: handle error
          console.error(err)
        })
    }
  }
  private toggleSideNavs = (open: boolean = false) => (
    e: React.SyntheticEvent<HTMLElement>,
  ) => {
    this.setState({ sidebarNavs: open })
  }
  /**
   * @method fetchStatus
   */
  private fetchStatus = () => {
    // fetch brief statistics
    fetchStatistics({ type: 'brief' }).then(({ result: { tps, tpb, ipb } }) => {
      this.setState(state => ({ ...state, tps, tpb, ipb }))
    })
    // fetch peer Count
    const { peerCount, newBlockByNumberSubject } = this.props.CITAObservables
    peerCount(60000).subscribe((count: string) =>
      this.setState((state: any) => ({ ...state, peerCount: +count })),
    )
    // fetch Block Number and Block
    newBlockByNumberSubject.subscribe(block => {
      this.setState({
        block,
      })
    })
    newBlockByNumberSubject.connect()
  }
  private togglePanel = (panel: string) => (e?: any) => {
    this.setState(state => ({
      activePanel: panel,
    }))
  }

  private handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) {
      this.switchChain()
    }
  }

  protected handleInput = key => (
    e: React.SyntheticEvent<HTMLInputElement>,
  ) => {
    const { value } = e.currentTarget
    if (key === 'searchIp') {
      this.onSearch$.next({ key: 'searchIp', value })
    }
    this.setState(state => ({
      ...state,
      [key]: value,
    }))
  }
  private toggleLngMenu = (lngOpen = false) => e => {
    this.setState({ lngOpen, anchorEl: e.currentTarget })
  }

  private changeLng = (lng = 'en') => e => {
    this.setState({ lngOpen: false })
    // this.props.i18n.changeLanguage(lng)
    window.localStorage.setItem('i18nextLng', lng)
    window.location.reload()
  }
  private switchChain = () => {
    this.props.CITAObservables.setServer(
      this.state.searchIp.startsWith('http')
        ? this.state.searchIp
        : `http://${this.state.searchIp}`,
    )
    const chainIp = this.state.searchIp.startsWith('http')
      ? this.state.searchIp
      : `http://${this.state.searchIp}`
    window.localStorage.setItem('chainIp', chainIp)
    window.location.reload()
  }
  private searchSubscription: Subscription
  private translations = ['zh', 'en', 'ja-JP', 'ko', 'de', 'it', 'fr']
  render () {
    const { anchorEl, lngOpen } = this.state
    const {
      location: { pathname },
      t,
    } = this.props
    return createPortal(
      <React.Fragment>
        <AppBar position="static" elevation={0}>
          <Toolbar
            className={layout.center}
            classes={{
              root: styles.toolbarRoot,
            }}
          >
            <IconButton
              aria-label="open drawer"
              onClick={this.toggleSideNavs(true)}
              classes={{ root: styles.toggleIcon }}
            >
              <MenuIcon />
            </IconButton>
            <HeaderNavs containers={containers} pathname={pathname} />
            <SidebarNavs
              open={this.state.sidebarNavs}
              containers={containers}
              pathname={pathname}
              toggleSideNavs={this.toggleSideNavs}
            />
            <div className={styles.rightNavs}>
              <Button
                className={styles.navItem}
                onClick={this.togglePanel('metadata')}
              >
                {this.state.metadata.chainName || 'InvalidChain'}
              </Button>
              {this.props.config.panelConfigs.TPS ? (
                <Button
                  className={styles.navItem}
                  onClick={this.togglePanel('statistics')}
                >
                  {t('TPS')}: {this.state.tps.toFixed(2)}
                </Button>
              ) : null}
              <IconButton
                className={styles.navItem}
                onClick={this.togglePanel('search')}
              >
                <SearchIcon />
              </IconButton>
              <IconButton onClick={this.toggleLngMenu(true)}>
                <TranslateIcon />
              </IconButton>
              <Menu
                open={lngOpen}
                anchorEl={anchorEl}
                onClose={this.toggleLngMenu()}
              >
                {this.translations.map(lng => (
                  <MenuItem onClick={this.changeLng(lng)} key={lng}>
                    {t(lng).toUpperCase()}
                  </MenuItem>
                ))}
              </Menu>
            </div>
          </Toolbar>
        </AppBar>
        <RightSidebar
          on={this.state.activePanel !== ''}
          onClose={this.togglePanel('')}
          onOpen={() => {}}
        >
          <div className={styles.rightSidebarContent}>
            <AppBar color="default" position="sticky">
              <Toolbar
                classes={{
                  root: styles.toolbarRoot,
                }}
              >
                <Typography variant="title" color="inherit">
                  {this.state.activePanel}
                </Typography>
                <IconButton onClick={this.togglePanel('')}>
                  <CloseIcon />
                </IconButton>
              </Toolbar>
            </AppBar>
            {this.state.activePanel === 'metadata' ? (
              <MetadataPanel
                metadata={this.state.metadata}
                handleInput={this.handleInput}
                searchIp={this.state.searchIp}
                searchResult={this.state.otherMetadata}
                switchChain={this.switchChain}
                handleKeyUp={this.handleKeyUp}
              />
            ) : this.state.activePanel === 'statistics' ? (
              <BriefStatisticsPanel
                peerCount={this.state.peerCount}
                number={this.state.block.header.number}
                timestamp={this.state.block.header.timestamp}
                proposal={this.state.block.header.proof.Tendermint.proposal}
                tps={this.state.tps}
                tpb={this.state.tpb}
                ipb={this.state.ipb}
              />
            ) : (
              <SearchPanel />
            )}
          </div>
        </RightSidebar>
      </React.Fragment>,
      document.getElementById('header') as HTMLElement,
    )
  }
}

export default translate('microscope')(withConfig(withObservables(Header)))
