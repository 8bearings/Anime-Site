import { ShowCardProps } from "../types/interfaces"
import "../css/ShowCard.css"


export function ShowCard({show}: ShowCardProps){

    function onFavClick() {
        alert('CLICKED BTN')
    }

    return(
    <div className="show-card">
        <div className="thumbnail-poster">
            <img src={show.url} alt={show.title} />
        </div>
        <div className="show-overlay">
            <button className="favorite-btn" onClick={onFavClick}>
            ♥
            </button>
        </div>
        <div className="show-info">
            <h3>{show.title}</h3>
            <p>{show.releaseDate}</p>
        </div>
    </div>
    )
}