import './App.css';
import React from 'react'
import Poem from './components/PoemTable'
import { Route, Routes, Link, Navigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import Search from './components/Search';
import { HeaderImg } from './components/Header';
import { Home } from './components/Home';
import { About } from './components/About';
import { Acknowledgements } from './components/Acknowledgements';

const { Header, Content, Footer } = Layout;

export default class App extends React.Component{

  render() {
    return (
      <div className="App">
      <HeaderImg title="The Tale of Genji Poem Database" subTitle="Gamma Version"/>
      <Layout
        style={{
          minHeight: "90vh"
        }}
      >
      <Header
        style={{
          position: 'relative',
          // zIndex: 1,
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
              <Link to="/">Home</Link>
            )
          }, 
          // {
          //   key: 'Chapters',
          //   label: 'Chapters'
          // }, 
          // {
          //   key: 'Characters',
          //   label: 'Characters'
          // }, 
          // {
          //   key: 'Poems',
          //   label: 'Poems'
          // }, 
          {
            key: 'Search',
            label: (
              <Link to="/search">Search</Link>
            )
          }, 
          // {
          //   key: 'Edit',
          //   label: 'Edit'
          // }
          {
            key: 'About Poetry in the Tale of Genjii',
            label: (
              <Link to="/about">About Poetry in the Tale of Genjii</Link>
            )
          }, 
          {
            key: 'Acknowledgements',
            label: (
              <Link to="/acknowledgements">Acknowledgements</Link>
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
      <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/search" element={<Search />}>
            <Route path=":chapter/:spkrGen/:speaker/:addrGen/:addressee/:auth/:username/:password" element={<Poem />}></Route>
          </Route>
          <Route path="/about" element={<About />}/>
          <Route path="/acknowledgements" element={<Acknowledgements />}/>
          <Route path="/" element={<Navigate to="/"/>} />
      </Routes>
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
)}}