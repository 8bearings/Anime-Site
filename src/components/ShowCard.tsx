import { ShowCardProps } from "../types/interfaces"


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

            </button>
        </div>
    </div>
    )
}