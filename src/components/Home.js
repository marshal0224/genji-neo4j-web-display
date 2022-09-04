import React from 'react';
import { LoremIpsum, Avatar } from 'react-lorem-ipsum';
import { useLocation } from 'react-router-dom';

export const Home = () => {
    return (
        <div>
            <div className="site-layout-content">
                <LoremIpsum p={6} />
            </div>
        </div>
    )
}