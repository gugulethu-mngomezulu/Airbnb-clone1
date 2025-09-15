import React from 'react';
import './SearchResult.css';
import { useNavigate } from 'react-router-dom';

function SearchResult({ img, location, title, description, star, price, total, interiors }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/staydetails', {
      state: {
        stay: {
          img,
          location,
          title,
          description,
          star,
          price,
          total,
          interiors
        }
      }
    });
  };

    return (
        <div className="searchResult__link" onClick={handleClick}>
      <div className="searchResult">
        <img src={img} alt={title} />
                <div className="searchResult__info">
                    <div className="searchResult__infoTop">
                        <p>{location}</p>
                        <h3>{title}</h3>
                        <p>⭐ {star}</p>
                        <p>{description}</p>
                    </div>
                    <div className="searchResult__infoBottom">
                        <div className="searchResult__price">
                            <h2>{price}</h2>
                            <p>{total}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SearchResult;
