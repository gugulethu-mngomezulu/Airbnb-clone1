import React from 'react';
import './SearchPage.css';
import { FaFilter, FaBed, FaDollarSign, FaHome, FaSlidersH } from 'react-icons/fa';
import SearchResult from "./SearchResult";

function SearchPage() {
    return (
        <div className='searchPage'>
            <div className='searchPage__info'>
                <p>62 stays · 26 August to 30 August · 2 guests</p>
                <h1>Stays nearby</h1>
                <div className="searchPage__filters">
                    <button><FaSlidersH /> Cancellation Flexibility</button>
                    <button><FaHome /> Type of place</button>
                    <button><FaDollarSign /> ZAR</button>
                    <button><FaBed /> Rooms and beds</button>
                    <button><FaFilter /> More filters</button>
                </div>
            </div>

            <SearchResult
                img="https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQwOTQzNzcwNTA0NzQwOTE5NQ==/original/1251c55e-08f3-4ba4-beea-0ff4aa50fa63.jpeg?im_w=960"
                location="Private room in Sandton"
                title="Spacious Edwardian House"
                description="1 guest · 1 bedroom · 1.5 shared bathrooms · Wifi · Kitchen · Free parking"
                star={4.73}
                price="R300 / night"
                total="R5000 total"
                interiors={[
                    "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQwOTQzNzcwNTA0NzQwOTE5NQ==/original/e59da450-715c-4673-99fa-58e369c25e74.jpeg?im_w=720",
                    "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQwOTQzNzcwNTA0NzQwOTE5NQ==/original/c477c943-1e4b-442f-910f-ef8813346ac6.jpeg?im_w=720",
                    "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQwOTQzNzcwNTA0NzQwOTE5NQ==/original/032d9e9c-aad6-47aa-aff0-f2f902344e0e.jpeg?im_w=720"
                ]}
            />

            <SearchResult
                img="https://a0.muscache.com/im/pictures/cd0dc690-ad98-4177-9296-b19c93ac944c.jpg?im_w=960"
                location="Private room in Cape Town"
                title="Independent Luxury Studio"
                description="2 guest · 3 bedroom · Wifi · Kitchen"
                star={4.3}
                price="R400 / night"
                total="R8000 total"
                interiors={[
                    "https://a0.muscache.com/im/pictures/dabbff63-591a-44d8-a693-8a29c6c334ec.jpg?im_w=720",
                    "https://a0.muscache.com/im/pictures/62dd101f-887c-49b9-9623-e444e4939d90.jpg?im_w=720",
                    "https://a0.muscache.com/im/pictures/dabbff63-591a-44d8-a693-8a29c6c334ec.jpg?im_w=720"
                ]}
            />

            <SearchResult
                img="https://a0.muscache.com/im/pictures/miso/Hosting-771431228883234618/original/49d14dde-7b75-46a6-b9d9-a2d652d4046c.jpeg?im_w=960"
                location="Private room in Midrand"
                title="Studio Apartments"
                description="4 guest · 4 bed · 2 bathrooms · Free parking"
                star={3.8}
                price="R350 / night"
                total="R9000 total"
                interiors={[
                    "https://a0.muscache.com/im/pictures/miso/Hosting-771431228883234618/original/59d1722e-52ae-4be2-bb11-a8c71d411fab.jpeg?im_w=720",
                    "https://a0.muscache.com/im/pictures/miso/Hosting-771431228883234618/original/4571ac60-3cd0-44e0-b3f7-35e7493badc6.jpeg?im_w=720",
                    "https://a0.muscache.com/im/pictures/miso/Hosting-771431228883234618/original/fddc850b-4446-4838-b33f-7704640768f4.jpeg?im_w=720"
                ]}
            />

            <SearchResult
                img="https://a0.muscache.com/im/pictures/d4876ef6-fa8c-4d27-81ef-66fcd11ef050.jpg?im_w=960"
                location="Private room in Cape Town"
                title="30 mins to V & A Waterfront"
                description="1 guest · 1 bedroom · Wifi · Kitchen · Washing Machine"
                star={4.1}
                price="R550 / night"
                total="R9000 total"
                interiors={[
                    "https://a0.muscache.com/im/pictures/93ccba34-4106-4968-9781-8bcb0294573a.jpg?im_w=720",
                    "https://a0.muscache.com/im/pictures/a649f532-7f3a-46c6-a191-df707748ef34.jpg?im_w=720",
                    "https://a0.muscache.com/im/pictures/56d38aad-56f4-4a61-a7c0-c0538bc5947d.jpg?im_w=720"
                ]}
            />

            <SearchResult
                img="https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTI5MjE0MjY2MzcyODkxMjQ5NQ%3D%3D/original/1c16af25-3d26-40bd-9a71-54c3cbfb4615.jpeg?im_w=960"
                location="Private room in Pretoria"
                title="Spacious Peaceful Modern Bedroom"
                description="3 guest · 1 bedroom · Wifi · Free parking"
                star={5.0}
                price="R600 / night"
                total="R7000 total"
                interiors={[
                    "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTI5MjE0MjY2MzcyODkxMjQ5NQ%3D%3D/original/962ae795-48ff-4fe0-ad43-2f6d7b816a1c.jpeg?im_w=720",
                    "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTI5MjE0MjY2MzcyODkxMjQ5NQ%3D%3D/original/2006d36e-f546-4b07-8d19-7cb559d9f32a.jpeg?im_w=720",
                    "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTI5MjE0MjY2MzcyODkxMjQ5NQ%3D%3D/original/5471a756-9963-47f0-bb2f-11c09612657d.jpeg?im_w=720"
                ]}
            />

            <SearchResult
                img="https://a0.muscache.com/im/pictures/62f7c2d1-361f-4f84-97ef-5c65868b7674.jpg?im_w=960"
                location="Room in Johannesburg CBD"
                title="The Blue Room"
                description="2 guest · 1 bedroom · Washing Machine"
                star={4.23}
                price="R650 / night"
                total="R4500 total"
                interiors={[
                    "https://a0.muscache.com/im/pictures/6cf82f61-2033-4370-b6f0-108246de92f1.jpg?im_w=720",
                    "https://a0.muscache.com/im/pictures/5adc1a2f-7035-4623-a1b9-2248639b72fa.jpg?im_w=720",
                    "https://a0.muscache.com/im/pictures/3df6c755-a3f9-467d-b429-0f18596d2f2d.jpg?im_w=720"
                ]}
            />

            <SearchResult
                img="https://a0.muscache.com/im/pictures/miso/Hosting-1217286406010947869/original/5cb0a652-b6b6-4b7c-ba9c-b9a629720474.jpeg?im_w=960"
                location="Private room in Cape Town"
                title="5 Star Luxury Apartment"
                description="3 guest · 1 bedroom · Wifi · Free parking"
                star={3.85}
                price="R500 / night"
                total="R9500 total"
                interiors={[
                    "https://a0.muscache.com/im/pictures/miso/Hosting-1217286406010947869/original/34c31ec4-007c-47a1-9f87-26651e9c765a.jpeg?im_w=720",
                    "https://a0.muscache.com/im/pictures/miso/Hosting-1217286406010947869/original/ea565b3d-abaa-42da-9351-ae90d03b1595.jpeg?im_w=720",
                    "https://a0.muscache.com/im/pictures/miso/Hosting-1217286406010947869/original/9f1306ed-3265-4b0a-8121-d411dd71e5d0.jpeg?im_w=720"
                ]}
            />
        </div>
    );
}

export default SearchPage;
