import '../styles/global.css';
import React from 'react'
import { Layout, Menu } from 'antd';
import { HeaderImg } from './Header';
import Link from 'next/link';

const { Header, Content, Footer } = Layout;

export default function App({ Component, pageProps }) {

  return (
    <div className="App">
    <HeaderImg title="The Tale of Genji Poem Database" subTitle="Delta Version"/>
    <Layout
      style={{
        minHeight: "90vh"
      }}
    >
    <Header
      style={{
        position: 'relative',
        width: '100%',
        padding: '0',
        background: 'white',
      }}
    >
    <Menu
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        textAlign: 'center',
      }}
      mode="horizontal"
      items={[
        {
          key: 'Home',
          label: (
            <Link href={"/"}>Home</Link>
          )
        }, 
        // {
        //   key: 'Chapters',
        //   label: 'Chapters'
        // }, 
        // {
        //   key: 'Poem',
        //   label: (
        //     <Link href={"/poems"}>Poems</Link>
        //   )
        // }, 
        // {
        //   key: 'Characters',
        //   label: (
        //     <Link to="/characters">Characters</Link>
        //   )
        // },
        // {
        //   key: 'AltChars',
        //   label: (
        //     <Link to="/alt_characters">AltChar</Link>
        //   )
        // }, 
        // {
        //   key: 'Allusions',
        //   label: (
        //     <Link to="/allusions">Allusions</Link>
        //   )
        // }, 
        // {
        //   key: 'Search',
        //   label: (
        //     <Link to="/search">Search</Link>
        //   )
        // }, 
        // {
        //   key: 'Edit',
        //   label: (
        //     <Link to="/edit">Edit</Link>
        //   )
        // }, 
        {
          key: 'About Poetry in the Tale of Genjii',
          label: (
            <Link href={"/about"}>About Poetry in the Tale of Genji</Link>
          )
        }, 
        {
          key: 'Acknowledgements',
          label: (
            <Link href={"/acknowledgements"}>Acknowledgements</Link>
          )
        }
      ]}
    />
    </Header> 
    <Content
      className="site-layout"
      style={{
        position: 'relative',
        padding: '0 50px',
        height: "calc(90vh - 134px)",
        backgroundColor: 'white', 
      }}
    >
      <Component {...pageProps} />
    </Content>
    {/* <Footer
      style={{
        textAlign: 'center',
      }}
    >
      J. Keith Vincent © 2022
    </Footer> */}
    </Layout>
    </div>
  )
}