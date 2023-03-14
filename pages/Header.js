import Genji_emaki_azumaya from "../public/assets/Genji_emaki_azumaya.jpg"
import React from 'react';

export const HeaderImg = ({title, subTitle}) => {
    return (
        // <section>
            <div 
            style={{ backgroundImage: `url(${Genji_emaki_azumaya})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                height: '94vh'
            }}
            >

                <div className="container" style={{
                    position: 'absolute',
                    bottom: '6vh',
                    width: '100%'
                }}>
                    <div className="text-center justify-content-center align-self-center">
                        <h1 className="pt-5 pb-3" 
                            style={{
                                color: 'white'
                            }}
                        >{title}</h1>
                        <h3 
                            style={{
                                color: 'white'
                            }}
                        >{subTitle}</h3>
                    </div>
                </div>
            </div>
        // </section>
    )
}