import "../css/Favorites.css"
import { useShowContext } from "../contexts/ShowContext"
import { ShowCard } from "../components/ShowCard"
import { AnimeShow } from "../types/interfaces"

export function Favorites() {
    const context = useShowContext()
  if (!context) {
    throw new Error('Favorites must be used within a ShowProvider')
  }
    
  const {favorites} = context

  if (favorites.length > 0 ){
    return(
<div className="favorites">
    <h2>Your Favorites</h2>
     <div className='shows-grid'>
              { favorites.map((show: AnimeShow, index: number) => (
                
                <ShowCard show={show} key={`${show.mal_id}-${index}`} />
              ))}     
          </div>
          </div>
    )
  }

    return(
        <div className='favorites-empty'>
            <h2>No Favorite Shows Yet</h2>
            <p>Start adding anime to your favorites and they will be shown here</p>

        </div>
    )
}