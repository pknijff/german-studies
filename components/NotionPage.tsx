import * as React from 'react'
import cs from 'classnames'
import { useRouter } from 'next/router'
import { useSearchParam } from 'react-use'
import BodyClassName from 'react-body-classname'
import { PageBlock } from 'notion-types'

// core notion renderer
import { NotionRenderer, Text } from 'react-notion-x'

// utils
import { getBlockTitle, getPageProperty } from 'notion-utils'
import { mapPageUrl, getCanonicalPageUrl } from 'lib/map-page-url'
import { mapImageUrl } from 'lib/map-image-url'
import { searchNotion } from 'lib/search-notion'
import { useDarkMode } from 'lib/use-dark-mode'
import * as types from 'lib/types'
import * as config from 'lib/config'

// components
import { Loading } from './Loading'
import { Page404 } from './Page404'
import { PageHead } from './PageHead'
import { Footer } from './Footer'

import styles from './styles.module.css'
import Script from 'next/script'

// -----------------------------------------------------------------------------
// dynamic imports for optional components
// -----------------------------------------------------------------------------

const Callout = ({ block }) => {
  const callout = block.properties?.title
  const router = useRouter()

  const name = router.query.name ? router.query.name.toString() : ''

  const resolvedCallout = callout.map(([text]) => {
    const date_0 = new Date('05/25/2022')
    const today = new Date()
    const daysCount = days(today, date_0)
    const daysInResearch = daysCount < 0 ? '0' : daysCount

    return text
      .replace('%name%', name.charAt(0).toUpperCase() + name.slice(1))
      .replace('%day%', daysInResearch)
  })

  return (
    <div
      className={cs(
        'notion-callout',
        block.format?.block_color && `notion-${block.format?.block_color}_co`,
        block.id
      )}
    >
      {/* <PageIcon block={block} /> */}
      {/* console.log(block); */}
      <div className='notion-page-icon-inline notion-page-icon-span'>
        <span className='notion-page-icon' role='img' aria-label='👋'>
          👋
        </span>
      </div>
      <div className='notion-callout-text'>
        <Text value={[resolvedCallout]} block={block} />
      </div>
    </div>
  )
}

const days = (date_1, date_2) => {
  const difference = date_1.getTime() - date_2.getTime()
  const TotalDays = Math.ceil(difference / (1000 * 3600 * 24))
  return TotalDays
}

export const NotionPage: React.FC<types.PageProps> = ({
  site,
  recordMap,
  error,
  pageId
}) => {
  const router = useRouter()
  const lite = useSearchParam('lite')

  const components = React.useMemo(
    () => ({
      Callout
    }),
    []
  )

  // lite mode is for oembed
  const isLiteMode = lite === 'true'

  const { isDarkMode } = useDarkMode()

  const siteMapPageUrl = React.useMemo(() => {
    const params: any = {}
    if (lite) params.lite = lite

    const searchParams = new URLSearchParams(params)
    return mapPageUrl(site, recordMap, searchParams)
  }, [site, recordMap, lite])

  const keys = Object.keys(recordMap?.block || {})
  const block = recordMap?.block?.[keys[0]]?.value

  // const isRootPage =
  //   parsePageId(block?.id) === parsePageId(site?.rootNotionPageId)
  const isBlogPost =
    block?.type === 'page' && block?.parent_table === 'collection'

  const showTableOfContents = !!isBlogPost
  const minTableOfContentsItems = 3

  const footer = React.useMemo(() => <Footer />, [])

  if (router.isFallback) {
    return <Loading />
  }

  if (error || !site || !block) {
    return <Page404 site={site} pageId={pageId} error={error} />
  }

  const title = getBlockTitle(block, recordMap) || site.name

  if (!config.isServer) {
    // add important objects to the window global for easy debugging
    const g = window as any
    g.pageId = pageId
    g.recordMap = recordMap
    g.block = block
  }

  const canonicalPageUrl =
    !config.isDev && getCanonicalPageUrl(site, recordMap)(pageId)

  const socialImage = mapImageUrl(
    getPageProperty<string>('Social Image', block, recordMap) ||
      (block as PageBlock).format?.page_cover ||
      config.defaultPageCover,
    block
  )

  const socialDescription =
    getPageProperty<string>('Description', block, recordMap) ||
    config.description

  return (
    <>
      <PageHead
        pageId={pageId}
        site={site}
        title={title}
        description={socialDescription}
        image={socialImage}
        url={canonicalPageUrl}
      />
      <Script id='stripe-js' src='/static/script.js' />
      {isLiteMode && <BodyClassName className='notion-lite' />}
      {isDarkMode && <BodyClassName className='dark-mode' />}

      <NotionRenderer
        bodyClassName={cs(
          styles.notion,
          pageId === site.rootNotionPageId && 'index-page'
        )}
        darkMode={isDarkMode}
        components={components}
        recordMap={recordMap}
        rootPageId={site.rootNotionPageId}
        rootDomain={site.domain}
        fullPage={!isLiteMode}
        previewImages={!!recordMap.preview_images}
        showCollectionViewDropdown={false}
        showTableOfContents={showTableOfContents}
        minTableOfContentsItems={minTableOfContentsItems}
        defaultPageIcon={config.defaultPageIcon}
        defaultPageCover={config.defaultPageCover}
        defaultPageCoverPosition={config.defaultPageCoverPosition}
        mapPageUrl={siteMapPageUrl}
        mapImageUrl={mapImageUrl}
        searchNotion={config.isSearchEnabled ? searchNotion : null}
        footer={footer}
      />
    </>
  )
}
