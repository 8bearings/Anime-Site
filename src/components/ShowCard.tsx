import { ShowCardProps } from "../types/interfaces"
import "../css/ShowCard.css"


export function ShowCard({show}: ShowCardProps){

    function onFavClick() {
        alert('CLICKED BTN')
    }

    return(
    <div className="show-card">
        <div className="thumbnail-poster">
            <img src={show.images.jpg.large_image_url} alt={show.title_english} />
        </div>
        <div className="show-overlay">
            <button className="favorite-btn" onClick={onFavClick}>
            ♥
            </button>
        </div>
        <div className="show-info">
            <h3>{show.title_english}</h3>
            <p>{show.aired.prop.from.year}</p>
        </div>
    </div>
    )
}


