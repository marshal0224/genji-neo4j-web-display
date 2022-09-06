import { Col, Row } from 'antd';
import React from 'react';
import { LoremIpsum, Avatar } from 'react-lorem-ipsum';
import { useLocation } from 'react-router-dom';

export const Home = () => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Row gutter={[16, 48]}>
                <Col span={6}></Col>
                <Col span={12}>
                <p style={{ textAlign: 'left' }}>
                    <br></br>
                    <br></br>
                    <br></br>
                    <br></br>
                    The Genji Poetry Database is a project created by Professor J. Keith Vincent and his students in LJ250 “Masterpieces of Japanese Literature" at Boston University. The database contains all 795 poems in Murasaki Shikibu's tenth century masterpiece, <i>The Tale of Genji</i>. The poems are searchable by chapter, speaker, and addressee and can be accessed in the original Japanese, in transliterated Roman letters (<i>romaji</i>), and in five different English translations by Arthur Waley, Edward Seidensticker, Royall Tyler, Dennis Washburn, and Edwin Cranston.
                </p>
                <p style={{ textAlign: 'left' }}>
                    Why just the poetry? In the <i>Tale of Genji</i>, the characters write poetry to communicate with each other and to commune with themselves and the non-human world. These poems being <i>poems</i>, they also do much more than relay unambiguous messages. If the characters speak to each other in poems, the poems also speak to each other beyond any given exchange. They open out into an additional dimension, a poetic universe shared by readers that arches across and through the narrative fabric of the <i>Tale</i>. Reading the poems on their own is a little like tapping into the emotional and symbolic circulatory system of the <i>Tale</i>. It can also provide a glimpse into how Murasaki wove the plot of her storytelling around kernels of poetic images and tropes. Studding her prose with poetry, she magnified the expressive power of her writing. In the process, she raised the social status of narrative fiction in Japanese, a genre that until her time was derided as the mere scribbling of women. In fact, she was so successful in doing so that her <i>Tale</i> became the central text of the Japanese canon and a model for the writing of poetry, the most prestigious genre of all.  As the great courtier-poet Fujiwara Shunzei would exclaim scarcely two centuries after her <i>Tale</i> was completed, "To compose poetry without knowing <i>The Tale of Genji</i>? It's outrageous!" (源氏見ざる歌詠みは遺恨なり。)
                </p>
                <p style={{ textAlign: 'left' }}>
                    This website follows in a long tradition in Japan of reading the poems in the <i>Tale of Genji</i> independently of their narrative context. Use it to read the poems on their own, or follow along as you read the <i>Tale</i>. When you finish a chapter, you may want to reread the poems here as a way of reviewing the emotional contours of the chapter. Use the database to see all the poems written or received by a given character, or follow the poetic dialogue between pairs of characters over the course of the novel. Compare the translations and see how vastly and wonderfully different they can be. Use the filters and keyword search to find patterns. And enjoy! We plan to add more functions to the website soon, so check back often.
                </p>
                <p style={{ textAlign: 'left' }}>
                    This website would never have been possible without the help of the many students in LJ 250 over the years who have painstakingly entered and tagged the poems.
                </p>
                <p style={{ textAlign: 'left' }}>
                    Special thanks to Rebekah Machemer, who designed and built the first iteration of the website, to Elijah Woo, who heroically entered all the Uji chapters and more all by himself, and finally to Marshal Dong, who has selflessly invested countless hours to bring the site to its current state.
                </p>
                <p style={{ textAlign: 'left' }}>
                    <i>The painting above is from the Tale of Genji Scrolls</i> (Genji monogatari emaki), Azumaya I, in the collection of the Tokugawa Art Museum.
                </p>
                <p>
                    This website is powered by <a href='https://reactjs.org/'>React.js</a>, and the database is powered by <a href='https://neo4j.com/'>Neo4j</a>.
                </p>
                </Col>
                <Col span={6}></Col>
            </Row>
        </div>

    )
}